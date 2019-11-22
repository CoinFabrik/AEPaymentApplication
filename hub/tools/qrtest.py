import copy
import gzip

import StringIO

import qrcode
import json


data = {
        "merchant": "ak_2c98cs9skoK5W5ugwabipd2XCNxfnPsQx8BBPWhBAafHpvwf4r",
        "amount": "1000000000000000000000000000",
        "something": "123456789012345678901234567890",
        "uuid": "d683ba36-a1d9-45e5-8b26-4311c1a88142",
        "type": "payment-request"
    }

def gen_json(data):
    return json.dumps({
        "merchant": data["merchant"],
        "amount": data["amount"],
        "something": data["something"]
    })

def gen_json_compr(data):
    return json.dumps({
        "merchant": data["merchant"],
        "amount": data["amount"],
        "something": data["something"]
    }).replace(" ", "")

def gen_csv(data):
    return ",".join(data.values())

def plain(x): return x

def _gzip(src):
    out = StringIO.StringIO()
    with gzip.GzipFile(fileobj=out, mode="w") as f:
        f.write(src)
    return out.getvalue()

def _gzip_b64(src):
    out = StringIO.StringIO()
    with gzip.GzipFile(fileobj=out, mode="w") as f:
        f.write(src)
    return out.getvalue().encode("base64")


def all_data(x):
    return x

def no_type(d):
    dd = copy.deepcopy(d)
    dd.pop("type")
    return dd

def no_uuid(d):
    dd = copy.deepcopy(d)
    dd.pop("uuid")
    return dd

def no_uuid_no_type(d):
    return no_uuid( no_type(d) )


for g in [gen_json, gen_json_compr, gen_csv]:
    for compr in [plain, _gzip, _gzip_b64]:
        for dataf in [all_data, no_type, no_uuid, no_uuid_no_type]:
            srcdata = g(dataf(data))
            srcdata = compr(srcdata)
            q = qrcode.make(srcdata)
            print ("   ".join(map(str, [ g.func_name, compr.func_name, dataf.func_name, q.width ])))
        print("----------------")
