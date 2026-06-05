// Polyfill DOMMatrix for Node.js environments where @napi-rs/canvas fails to
// load (e.g. Vercel Lambda). pdfjs-dist 5.x uses DOMMatrix at module init time
// and only falls back to @napi-rs/canvas — it has no pure-JS fallback.
// This must be imported before pdf-parse so it runs first in the webpack bundle.
if (typeof globalThis.DOMMatrix === 'undefined') {
  class DOMMatrix {
    constructor(init) {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
      this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
      this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
      this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
      this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
      this.is2D = true;
      this.isIdentity = true;
      if (init != null) this._apply(init);
    }
    _apply(init) {
      let v = Array.isArray(init) ? init : null;
      if (!v && typeof init === 'string') {
        const m = init.match(/matrix(?:3d)?\(([^)]+)\)/);
        if (m) v = m[1].split(',').map(Number);
      }
      if (!v) return;
      if (v.length === 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = v;
        this.m11 = this.a; this.m12 = this.b;
        this.m21 = this.c; this.m22 = this.d;
        this.m41 = this.e; this.m42 = this.f;
        this.isIdentity = (this.a===1&&this.b===0&&this.c===0&&this.d===1&&this.e===0&&this.f===0);
      } else if (v.length === 16) {
        [this.m11,this.m12,this.m13,this.m14,
         this.m21,this.m22,this.m23,this.m24,
         this.m31,this.m32,this.m33,this.m34,
         this.m41,this.m42,this.m43,this.m44] = v;
        this.a=this.m11; this.b=this.m12; this.c=this.m21; this.d=this.m22;
        this.e=this.m41; this.f=this.m42;
        this.is2D = (!v[2]&&!v[3]&&!v[6]&&!v[7]&&!v[8]&&!v[9]&&v[10]===1&&!v[11]&&v[15]===1);
        this.isIdentity = (this.m11===1&&this.m22===1&&this.m33===1&&this.m44===1&&
          !this.m12&&!this.m13&&!this.m14&&!this.m21&&!this.m23&&!this.m24&&
          !this.m31&&!this.m32&&!this.m34&&!this.m41&&!this.m42&&!this.m43);
      }
    }
    multiply(o) {
      return new DOMMatrix([
        this.a*o.a + this.c*o.b,
        this.b*o.a + this.d*o.b,
        this.a*o.c + this.c*o.d,
        this.b*o.c + this.d*o.d,
        this.a*o.e + this.c*o.f + this.e,
        this.b*o.e + this.d*o.f + this.f,
      ]);
    }
    multiplySelf(o)    { return Object.assign(this, this.multiply(o)); }
    preMultiplySelf(o) { return Object.assign(this, o.multiply(this)); }
    translate(tx=0, ty=0) { return this.multiply(new DOMMatrix([1,0,0,1,tx,ty])); }
    translateSelf(tx=0, ty=0) { return Object.assign(this, this.translate(tx,ty)); }
    scale(sx=1, sy=sx) { return this.multiply(new DOMMatrix([sx,0,0,sy,0,0])); }
    scaleSelf(sx=1, sy=sx) { return Object.assign(this, this.scale(sx,sy)); }
    rotate(deg=0) {
      const r=deg*Math.PI/180, c=Math.cos(r), s=Math.sin(r);
      return this.multiply(new DOMMatrix([c,s,-s,c,0,0]));
    }
    rotateSelf(deg=0) { return Object.assign(this, this.rotate(deg)); }
    inverse() {
      const det = this.a*this.d - this.b*this.c;
      if (!det) return new DOMMatrix();
      return new DOMMatrix([
        this.d/det, -this.b/det, -this.c/det, this.a/det,
        (this.c*this.f - this.d*this.e)/det,
        (this.b*this.e - this.a*this.f)/det,
      ]);
    }
    invertSelf() { return Object.assign(this, this.inverse()); }
    transformPoint(p={}) {
      const x=p.x||0, y=p.y||0;
      return { x:this.a*x+this.c*y+this.e, y:this.b*x+this.d*y+this.f, z:0, w:1 };
    }
    toFloat32Array() { return Float32Array.from([this.a,this.b,0,0,this.c,this.d,0,0,0,0,1,0,this.e,this.f,0,1]); }
    toFloat64Array() { return Float64Array.from([this.a,this.b,0,0,this.c,this.d,0,0,0,0,1,0,this.e,this.f,0,1]); }
    toString() { return `matrix(${this.a},${this.b},${this.c},${this.d},${this.e},${this.f})`; }
    static fromMatrix(o) { return new DOMMatrix([o.a,o.b,o.c,o.d,o.e,o.f]); }
    static fromFloat32Array(a) { return new DOMMatrix([...a]); }
    static fromFloat64Array(a) { return new DOMMatrix([...a]); }
  }
  globalThis.DOMMatrix = DOMMatrix;
}
