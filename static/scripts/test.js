console.log("Runs before other scripts");
console.log("ran1", document.getElementsByTagName("p"));

// let code = `
// Audio.prototype.myPlay = Audio.prototype.play;
// Audio.prototype.play = function() {
//     console.log("TT:", this);
//     return this.myPlay(arguments);
// };
// console.log("updated audio methods");`;


// const script = document.createElement('script');
// script.textContent = code;
// document.body.appendChild(script);
// (document.head||document.documentElement).appendChild(script);

Audio.prototype.myPlay = Audio.prototype.play;
Audio.prototype.play = function() {
    console.log("TT:", this);
    return this.myPlay(arguments);
};

// let proxied = Audio.prototype.play;
// Audio.prototype.play = function() {
//     console.log("TT:", this, arguments)
//     return proxied.apply(this, arguments);
// };

// b.isEqualNode(a); tag
// b.isSameNode(a); exact