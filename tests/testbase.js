/**
 * Created by Administrator on 2016/2/21.
 */

var o = {
    a:5
};
var pro = new Object();
o.prototype = pro;
console.log(isNaN(o));
console.log(o.valueOf());
console.log(o.toString());

console.log(o.constructor);
console.log(o.hasOwnProperty('a'));
console.log(o.propertyIsEnumerable('a'));
console.log(pro.isPrototypeOf(o));

function testChange(obj){
    obj.name = 'jack';
}

var person = new Object();
testChange(person);
console.log(person.name);
console.log(typeof person);
console.log(typeof testChange);
console.log(typeof console);
console.log(person instanceof Object);

function compare(value1,value2){
    return value1 - value2;
}

var arr = new Array();
arr.push(1);
arr.push(10);
arr.push(3);
arr.push(2);
arr.sort(compare);
console.log(arr);
console.log(arr.reverse());
console.log(arr.length);

function factoria(num){
    if(num <= 1){
        return 1;
    }else{
        console.log(arguments.callee.caller);
        console.log(arguments);
        return num * arguments.callee(num -1);
    }
}



console.log(factoria(4));
var global = function(){
    return this;
}();
//console.log(global);

var sub = {age:20};
Object.defineProperty(sub,'name',{
    //configurable:false,
    value: 'Jack'
});
console.log(sub);
/*
Object.defineProperty(sub,'name',{
    writable:true,
    value:'jack'
})*/
console.log(Object.getOwnPropertyDescriptor(sub,'age'));
delete sub.age
console.log(sub.age);
var book = {
    _year:2004,
    edition:1
};
console.log(book._year);
book._year = 2005;
console.log(book._year);
Object.defineProperty(book,'year',{
   get:function(){
        return this._year;
   },
    set:function(newvalue){
        if(newvalue > 2004){
            this._year = newvalue;
            this.edition += newvalue - 2004;
        }
    }
});

console.log(book.year);
function Child(name,age,weight){
    this.name = name;
    this.age = age;
    this.weight = weight;
    console.log(arguments.callee);
}

//var child = new Child('jack',20,100);
var o = new Object();
Child.call(o,'jack',20,100);
console.log(o.name);
console.log(o instanceof Child);
var z_str1 = '中国';
var z_str2 = '中国';
console.log(z_str1.localeCompare(z_str2));



