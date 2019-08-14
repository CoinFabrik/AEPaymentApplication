const nacl = require('tweetnacl');
const fs = require('fs');
const uuid = require('uuid');

function genUUID() {
    return uuid()
}

function getEnv(name, defvalue) {
    let value = defvalue;
    try{
        value = process.env[name];
        if (value==null) {
            value = defvalue;
        }
    } catch(err) { }
    return value;
}

function getArgv(idx, defvalue) {
    let value = defvalue;
    try{
        value = process.argv[idx];
        if (value==null) {
            value = defvalue;
        }
    } catch(err) { }
    return value;
}

async function get_private(name) {
    let data;
    try {
        data = fs.readFileSync("/home/aweil/repos/ea/"+name);
    } catch (err) {
        data = fs.readFileSync(name);
    }
    let pdata = JSON.parse(data).toString();
    return await recover("1234", pdata);
}

async function get_public(name) {
    let data;
    try {
        data = fs.readFileSync("/home/aweil/repos/ea/"+name);
    } catch(err) {
        data = fs.readFileSync(name);
    }
    let pdata = JSON.parse(data.toString());
    return pdata["public_key"];
}

async function get_account(filename, pwd) {
    let data = fs.
    readFileSync(filename).toString();
    let pdata = JSON.parse(data);
    let r = await recover(pwd, pdata);
    return {publicKey: pdata["public_key"], secretKey: r}
}

function isBase64 (str) {
  let index
  // eslint-disable-next-line no-useless-escape
  if (str.length % 4 > 0 || str.match(/[^0-9a-z+\/=]/i)) return false
  index = str.indexOf('=')
  return !!(index === -1 || str.slice(index).match(/={1,2}/))
}


const DEFAULTS = {
  crypto: {
    secret_type: 'ed25519',
    symmetric_alg: 'xsalsa20-poly1305',
    kdf: 'argon2id',
    kdf_params: {
      memlimit_kib: 65536,
      opslimit: 3,
      parallelism: 1
    }
  }
}



const CRYPTO_FUNCTIONS = {
  'xsalsa20-poly1305': { encrypt: null, decrypt: decryptXsalsa20Poly1305 }
}

// DERIVED KEY PART
const DERIVED_KEY_FUNCTIONS = {
  'argon2id': deriveKeyUsingArgon2id
}

async function deriveKeyUsingArgon2id (password, salt, options) {
  const { memlimit_kib: memoryCost, parallelism, opslimit: timeCost } = options.kdf_params
  const isBrowser = !(typeof module !== 'undefined' && module.exports)

  if (isBrowser) {
    const _sodium = require('libsodium-wrappers-sumo')

    return _sodium.ready.then(async () => {
      // tslint:disable-next-line:typedef
      const sodium = _sodium

      const result = sodium.crypto_pwhash(
        32,
        password,
        salt,
        timeCost,
        memoryCost * 1024,
        sodium.crypto_pwhash_ALG_ARGON2ID13
      )
      return Buffer.from(result)
    })
  } else {
    const argon2 = require('argon2')
    return argon2.hash(password, { timeCost, memoryCost, parallelism, type: argon2.argon2id, raw: true, salt })
  }
}


function decryptXsalsa20Poly1305 ({ ciphertext, key, nonce }) {
  const res = nacl.secretbox.open(ciphertext, nonce, key)
  if (!res) throw new Error('Invalid password or nonce')
  return res
}

function isHex (str) {
  return !!(str.length % 2 === 0 && str.match(/^[0-9a-f]+$/i))
}

function str2buf (str, enc=null) {
  if (!str || str.constructor !== String) return str
  if (!enc && isHex(str)) enc = 'hex'
  if (!enc && isBase64(str)) enc = 'base64'
  return Buffer.from(str, enc)
}

function decrypt (ciphertext, key, nonce, algo) {
  if (!CRYPTO_FUNCTIONS[algo]) throw new Error(algo + ' is not available')
  return CRYPTO_FUNCTIONS[algo].decrypt({ ciphertext, nonce, key })
}

async function deriveKey (password, nonce, options = {
  kdf_params: DEFAULTS.crypto.kdf_params,
  kdf: DEFAULTS.crypto.kdf
}) {
  if (typeof password === 'undefined' || password === null || !nonce) {
    throw new Error('Must provide password and nonce to derive a key')
  }

  if (!DERIVED_KEY_FUNCTIONS.hasOwnProperty(options.kdf)) throw new Error('Unsupported kdf type')

  return DERIVED_KEY_FUNCTIONS[options.kdf](password, nonce, options)
}


async function recover (password, keyObject) {
  validateKeyObj(keyObject)
  const nonce = Uint8Array.from(str2buf(keyObject.crypto.cipher_params.nonce))
  const salt = Uint8Array.from(str2buf(keyObject.crypto.kdf_params.salt))
  const kdfParams = keyObject.crypto.kdf_params
  const kdf = keyObject.crypto.kdf

  const key = await decrypt(
    Uint8Array.from(str2buf(keyObject.crypto.ciphertext)),
    await deriveKey(password, salt, { kdf, kdf_params: kdfParams }),
    nonce,
    keyObject.crypto.symmetric_alg
  )
  if (!key) throw new Error('Invalid password')
  return Buffer.from(key).toString('hex')
}

function validateKeyObj (obj) {
  const root = ['crypto', 'id', 'version', 'public_key']
  const cryptoKeys = ['cipher_params', 'ciphertext', 'symmetric_alg', 'kdf', 'kdf_params']

  const missingRootKeys = root.filter(key => !obj.hasOwnProperty(key))
  if (missingRootKeys.length) throw new Error(`Invalid key file format. Require properties: ${missingRootKeys}`)

  const missingCryptoKeys = cryptoKeys.filter(key => !obj['crypto'].hasOwnProperty(key))
  if (missingCryptoKeys.length) throw new Error(`Invalid key file format. Require properties: ${missingCryptoKeys}`)

  return true
}


module.exports = {
  get_account,
  get_public,
  getEnv,
  getArgv,
  genUUID
}
