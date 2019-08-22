const qr = require('qr-image');


async function store() {
      let b1 = qr.imageSync('{ "face": "😂" }');

      var arr = Array.prototype.slice.call(b1, 0)
      console.log(arr);
      console.log(typeof arr);

      console.log(JSON.stringify(arr))
      console.log(arr.toString())
      console.log(typeof (arr.toString()))

}


store().then(()=>{}).catch(console.error);
