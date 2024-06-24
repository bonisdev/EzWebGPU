
function sha1(msg) {
    function rotateLeft(n, s) {
        return (n << s) | (n >>> (32 - s));
    }

    function toHexStr(n) {
        let s = "", v;
        for (let i = 7; i >= 0; i--) {
            v = (n >>> (i * 4)) & 0x0f;
            s += v.toString(16);
        }
        return s;
    }

    function utf8Encode(str) {
        return unescape(encodeURIComponent(str));
    }

    const K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];

    msg = utf8Encode(msg);

    const msgLength = msg.length;

    let wordArray = [];
    for (let i = 0; i < msgLength - 3; i += 4) {
        wordArray.push((msg.charCodeAt(i) << 24) | (msg.charCodeAt(i + 1) << 16) | (msg.charCodeAt(i + 2) << 8) | msg.charCodeAt(i + 3));
    }

    switch (msgLength % 4) {
        case 0:
            wordArray.push(0x080000000);
            break;
        case 1:
            wordArray.push((msg.charCodeAt(msgLength - 1) << 24) | 0x0800000);
            break;
        case 2:
            wordArray.push((msg.charCodeAt(msgLength - 2) << 24) | (msg.charCodeAt(msgLength - 1) << 16) | 0x08000);
            break;
        case 3:
            wordArray.push((msg.charCodeAt(msgLength - 3) << 24) | (msg.charCodeAt(msgLength - 2) << 16) | (msg.charCodeAt(msgLength - 1) << 8) | 0x80);
            break;
    }

    while ((wordArray.length % 16) != 14) {
        wordArray.push(0);
    }

    wordArray.push(msgLength >>> 29);
    wordArray.push((msgLength << 3) & 0x0ffffffff);

    let H0 = 0x67452301;
    let H1 = 0xefcdab89;
    let H2 = 0x98badcfe;
    let H3 = 0x10325476;
    let H4 = 0xc3d2e1f0;

    let W = new Array(80);
    let a, b, c, d, e;
    for (let i = 0; i < wordArray.length; i += 16) {
        for (let t = 0; t < 16; t++) {
            W[t] = wordArray[i + t];
        }
        for (let t = 16; t < 80; t++) {
            W[t] = rotateLeft(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
        }

        a = H0;
        b = H1;
        c = H2;
        d = H3;
        e = H4;

        for (let t = 0; t < 80; t++) {
            let temp;
            if (t < 20) {
                temp = (rotateLeft(a, 5) + ((b & c) | (~b & d)) + e + W[t] + K[0]) & 0x0ffffffff;
            } else if (t < 40) {
                temp = (rotateLeft(a, 5) + (b ^ c ^ d) + e + W[t] + K[1]) & 0x0ffffffff;
            } else if (t < 60) {
                temp = (rotateLeft(a, 5) + ((b & c) | (b & d) | (c & d)) + e + W[t] + K[2]) & 0x0ffffffff;
            } else {
                temp = (rotateLeft(a, 5) + (b ^ c ^ d) + e + W[t] + K[3]) & 0x0ffffffff;
            }

            e = d;
            d = c;
            c = rotateLeft(b, 30);
            b = a;
            a = temp;
        }

        H0 = (H0 + a) & 0x0ffffffff;
        H1 = (H1 + b) & 0x0ffffffff;
        H2 = (H2 + c) & 0x0ffffffff;
        H3 = (H3 + d) & 0x0ffffffff;
        H4 = (H4 + e) & 0x0ffffffff;
    }

    return toHexStr(H0) + toHexStr(H1) + toHexStr(H2) + toHexStr(H3) + toHexStr(H4);
}

function hashToFloat(hash) {
    const hexPart = hash.substring(0, 16);
    const intVal = parseInt(hexPart, 16);
    const maxInt = Math.pow(2, 64) - 1;
    return intVal / maxInt;
}

class PseudRand{
    constructor(seed){
        this.seed = seed
        this.tot = 0
    }


    random(){
        this.seed = sha1(this.seed)
        this.tot++;
        return hashToFloat(this.seed)
    }
}



// const hash = sha1("hello world");
// const floatNumber = hashToFloat(hash);
// console.log(`Hash: ${hash}`);
// console.log(`Float: ${floatNumber}`);


//Helper functions
function toHexString(byteArray) {
	return Array.prototype.map.call(byteArray, function(byte) {
		return ('0' + (byte & 0xFF).toString(16)).slice(-2);
	}).join('');
}
function toByteArray(hexString) {
	var result = [];
	while (hexString.length >= 2) {
		result.push(parseInt(hexString.substring(0, 2), 16));
		hexString = hexString.substring(2, hexString.length);
	}
	return result;
}

//var HASHER = CHelper__B.hasher_256;

function CustomRandom_sha(newHash, preduns, pregenes){
	this.hash = "@legatuscoin"+newHash;
	this.runs = 0;
	this.precalced = [];
	this.precalcedCounter = -1;

	this.totalVals = [];

	this.nextHash = function(){
		HASHER.reset();
		this.hash = toHexString(
			HASHER.update(this.hash).digest()
		);
		return this.hash;
	};
	
	this.numFromHash = function(seed){
		const nBits = 52;
		seed = seed.slice(0, nBits / 4);
		const r = parseInt(seed, 16);
		let X = r / Math.pow(2, nBits); // uniformly distributed in [0; 1)
		return X;
	};

	this.random = function(){
		this.runs++;
		return this.numFromHash(this.nextHash());
	};

	this.random_pre = function(){
		this.precalcedCounter = 
			(this.precalcedCounter + 1) % 
			this.precalced.length;
		return this.precalced[this.precalcedCounter];
	};

	this.GET_GENE = function(){
        let kk = this.random();
        this.totalVals.push(kk);
        return kk;
    };

    this.END_GENE = function(){
        return this.totalVals;
    };

	for(let p = 0;p < preduns;p++){
		this.precalced.push(this.random());
	}
}