/**
 * Created by Administrator on 2016/2/24.
 */
function Child(name,age,weight){
    this.name = name;
    this.age = age;
    this.weight = weight;
}

Child.prototype.address = 'beijing';
var child = new Child('jack',20,100);
console.log(Object.keys(Child.prototype));
console.log(Object.keys(child));
console.log(Object.getOwnPropertyNames(Child.prototype));
console.log(Object.getOwnPropertyNames(child));
console.log(Object.getOwnPropertyDescriptor(child,'name'));
console.log(Object.getOwnPropertyDescriptor(Child.prototype,'address'));
console.log(Object.isExtensible(child));
console.log(Object.isExtensible(Child.prototype));
console.log(Object.getOwnPropertyNames(Object.prototype));
console.log(Object.getOwnPropertyNames(Array.prototype));

function propertyCheck(object,proName){
    return object.hasOwnProperty(proName) || (proName in object);
}

console.log(propertyCheck(new Array,'sort'));
var proNames = Object.getOwnPropertyNames(Array.prototype);
console.log('---------');
console.log(proNames);
console.log('---------');
for(var index in proNames){
    console.log('--'+proNames[index]);
}
for(var name in child){
    console.log(name);
}

function Person(name,age){
    var o = new Object();
    o.name = name;
    o.age = age;
    o.sayName = function(){
        console.log(this.name);
    };
    return o;
}

var p = new Person('jack',30);
p.sayName();
console.log(p instanceof Person);
console.log(p instanceof Object);
console.log(typeof p);

var longi = 10.99;
var longitude = parseFloat(longi == undefined ? 0 : longi);
console.log(longitude);
var str = ',text/javascript,application/json';
console.log(str.indexOf('application/json'));
console.log(str.indexOf('application/jsons'));
var str2 = 'http://e-wanju.com/toy_detail?toy_id=56d7e76db22b53722db26749&action=0';
console.log(str2.indexOf('/'));
//console.log(str2.substring());
//console.log(str2.index('x'));