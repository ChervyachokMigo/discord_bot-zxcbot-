var log = console.log.bind(console);

var fs = require('fs');
var lzma = require('lzma');

module.exports = {
	_cursoroffset: 0,
	debug: 0,
	fd: 0,

	openFile: async function(filepath){
		this._cursoroffset = 0
		this.fd = await fs.promises.open(filepath,'r')
	},

	closeFile: async function(){
		return await this.fd.close()
	},

	skipByte: async function (){
		this._cursoroffset += 1
	},

	skipBool: async function (){
		this._cursoroffset += 1
	},

	skipShort: async function (){
		this._cursoroffset += 2
	},

	skipInt: async function (){
		this._cursoroffset += 4
	},

	skipDate: async function (){
		this._cursoroffset += 8
	},

	skipLong: async function (){
		this._cursoroffset += 8
	},

	skipSingle: async function(){
		this._cursoroffset += 4
	},

	skipDouble: async function(){
		this._cursoroffset += 8
	},

	getByte: async function (){
		return this.getInt8()
	},

	getBool: async function (){
		return this.getInt8()
	},

	getShort: async function (){
		return this.getInt16()
	},

	getInt: async function (){
		return this.getInt32()
	},

	getDate: async function (){
		return this.getInt64()
	},

	getLong: async function (){
		return this.getInt64()
	},

	getSingle: async function(){
		let res = await this.bufferRead(this._cursoroffset,4)
		this._cursoroffset += 4
		res=res.readInt32LE(0).toString(16)
		res = res.substring(1)
		res = Buffer.from(res,'hex')
		res = (res.readInt16LE(0).toString(10))/2
		if (this.debug==1) log (res)
		return res
	},

	skipIntDoublePair: async function (){
		let count = await this.getInt()
		for (let i=1;i<=count;i++){
			await this.skipByte()
			await this.skipInt()
			await this.skipByte()
			await this.skipDouble()
		}
		if (this.debug==1) log ('skipped '+ count + 'IntDoublePairs')
	},

	getIntDoublePair: async function(){
		let res = []
		res.count = await this.getInt()
		
		for (let i=1;i<=res.count;i++){
			let res2 = {}
			res2.byte1 = await this.getByte()
			res2.int1 = await this.getInt()
			res2.byte2 = await this.getByte()
			res2.starrating = await this.getDouble()
			res.push(res2)
		}

		if (this.debug==1) {
			log (res)
		}
		return res
	},

	skipTimingPoints: async function(num){
		this._cursoroffset += 17 * num
		if (this.debug==1) log ('skipped '+num+' Timing points')
	},

	skipTimingPoints2: async function(){
		let timingPointsNumber = await this.getInt();
		this._cursoroffset += 17 * timingPointsNumber;
		if (this.debug==1) log ('skipped '+timingPointsNumber+' Timing points')
	},

	getTimingPoints: async function(){
		let timingPointsNumber = await this.getInt();
		var res = [];
		for (let tp=1; tp<=timingPointsNumber; tp++){
			res.push( await this.getTimingPoint() )
		}
		return res;
	},

	getTimingPoint: async function(){
		let res = {};
		res.bpm = await this.getDouble()
		res.offfset = await this.getDouble()
		res.isInherited = await this.getBool()
		if (this.debug==1) log (res)
		return res
	},

	getDouble: async function (){
		return this.getInt64()
	},

	buff2int: async function(hex){
		return await this.bin2int(await this.hex2bin(await this.changeEndianness(await this.buffer2hexstr(hex))))
	},

	changeEndianness: async function (string){
	  const result = [];
	  let len = string.length - 2;
	  while (len >= 0) {
	    result.push(string.substr(len, 2));
	    len -= 2;
	  }
	  return result.join('');
	},

	 hex2bin: async function (hex){
	  hex = hex.replace("0x", "").toLowerCase();
	  var out = "";
	  for(var c of hex) {
	    switch(c) {
	      case '0': out += "0000"; break;
	      case '1': out += "0001"; break;
	      case '2': out += "0010"; break;
	      case '3': out += "0011"; break;
	      case '4': out += "0100"; break;
	      case '5': out += "0101"; break;
	      case '6': out += "0110"; break;
	      case '7': out += "0111"; break;
	      case '8': out += "1000"; break;
	      case '9': out += "1001"; break;
	      case 'a': out += "1010"; break;
	      case 'b': out += "1011"; break;
	      case 'c': out += "1100"; break;
	      case 'd': out += "1101"; break;
	      case 'e': out += "1110"; break;
	      case 'f': out += "1111"; break;
	      default: return "";
	    }
	  }

	  return out;
	},

	bufferRead: async function (Offset,Length){
		let res = await this.fd.read(Buffer.alloc(Length),0,Length,Offset)
		return res.buffer
	},

	getULEB128: async function (){
		result = 0;
		shift = 0;
		while (true) {
			byte = await this.getByte()
			result |= (byte & 0x7f) << shift;
			if ((byte & 0x80) === 0)
				break;
			shift += 7;
		}
		return result;
	},

 	read7bitInt: async function(){
    let total = 0;
    let shift = 0;
    let byte = await this.getByte()
    if ((byte & 0x80) === 0) {
      total |= (byte & 0x7f) << shift;
    } else {
      let end = false;
      do {
        if (shift) {
          byte = await this.getByte()
        }
        total |= (byte & 0x7f) << shift;
        if ((byte & 0x80) === 0) end = true;
        shift += 7;
      } while (!end);
    }

    return total;
  },

  skipString: async function (){
  	let stringCode = await this.getInt8()
	if (stringCode == 11){
		let stringLength = await this.read7bitInt()
		if (stringLength > 0){
			this._cursoroffset += stringLength
		}
	}
	if (this.debug==1) log ('skipped String')
  },

	getString: async function(){		
		let stringCode = await this.getInt8()
		if (stringCode == 11){
				let stringLength = await this.getULEB128();
				let res = ''
				if (stringLength>0){
					res = (await this.getStringBytes(stringLength)).toString('utf8')
				}
				if (this.debug == 1) log ({String: res,Length:stringLength})
				return res
		}else {
			if (this.debug == 1) log ('error read string')
			return ''
		}
	},

	getStringBytes: async function (length){
		let res = '';
		if (length > 0){
			res = await this.bufferRead(this._cursoroffset,length)
			this._cursoroffset += length
		}
		return res
	},

	readUTF8Char: async function(){
		let res = Buffer.alloc(0)

		char = await this.bufferRead(this._cursoroffset,1)
		this._cursoroffset += 1

		res = Buffer.concat([res,char])

		let charInt = await this.hex2int(await (this.buffer2hexstr(char)))

		if (charInt >= 192 && charInt <= 223) {
			let char2 = await this.bufferRead(this._cursoroffset, 1)
			this._cursoroffset += 1
			res = Buffer.concat([res,char2])
		}
		if (charInt >= 224 && charInt <= 239) {
			let char3 = await this.bufferRead(this._cursoroffset, 1)
			this._cursoroffset += 1
			let char4 = await this.bufferRead(this._cursoroffset, 1)
			this._cursoroffset += 1
			res = Buffer.concat([res,char3,char4])							
		}
		if (charInt >= 240 && charInt <= 247) {
			let char5 = await this.bufferRead(this._cursoroffset, 1)
			this._cursoroffset += 1
			let char6 = await this.bufferRead(this._cursoroffset, 1)
			this._cursoroffset += 1
			let char7 = await this.bufferRead(this._cursoroffset, 1)
			this._cursoroffset += 1
			res = Buffer.concat([res,char5,char6,char7])
		}
		return res
	},

	getInt64: async function (){		
		let res = await this.buff2int(await this.bufferRead(this._cursoroffset,8))
		this._cursoroffset += 8
		if (this.debug==1) log (res)
		return res
	},

	getInt32: async function (){		
		let res = await this.buff2int(await this.bufferRead(this._cursoroffset,4))
		this._cursoroffset += 4
		if (this.debug==1) log (res)
		return res
	},

	getInt16: async function (){
		let res = await this.buff2int(await this.bufferRead(this._cursoroffset,2))
		this._cursoroffset += 2
		if (this.debug==1) log (res)
		return res
	},

	getInt8: async function (){
		let res = await this.buff2int(await this.bufferRead(this._cursoroffset,1))
		this._cursoroffset += 1
		if (this.debug==1) log (res)
		return res
	},

	getInt8withoutOffset: async function (){
		let res = await this.buff2int(await this.bufferRead(this._cursoroffset,1))
		if (this.debug==1) log (res)
		return res
	},

	bin2int: async function(binary){
		return parseInt(binary,2)
	},

	hex2int: async function(hex){
		return parseInt(hex,16)
	},

	int2hex: async function (int){
		return int.toString(16)
	},

	buffer2hexstr: async function (BufferHex){
		return BufferHex.toString('hex')
	},

	getLZMAString: async function(buf){
		return new Promise (async (response,rej)=>{
			await lzma.decompress(buf, (result,err)=>{
				if (err) rej (err);
				response(result);
			});
		});
	}
}

