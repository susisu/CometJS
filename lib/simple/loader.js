/*
 * CometJS / simple / loader.js
 * copyright (c) 2015 Susisu
 */

"use strict";

function end () {
    module.exports = Object.freeze({
        "Loader": Loader
    });
}

var lq = require("loquat");

var comet = {
    "simple": {
        "source": require("./source.js")
    }
};

function RuntimeError(pos, message) {
    this.pos     = pos;
    this.message = message;
}

RuntimeError.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value"       : RuntimeError
    },
    "toString": {
        "value": function () {
            if (this.pos !== undefined) {
                return this.pos.toString() + ":\n" + this.message;
            }
            else {
                return this.message;
            }
        }
    }
});

function unboundError(pos, name) {
    return new RuntimeError(
        pos,
        "unbound variable '" + name + "'"
    );
}

function invalidApplicationError(pos) {
    return new RuntimeError(
        pos,
        "invalid application"
    );
}

function typeError(pos, expected, actual) {
    return new RuntimeError(
        pos,
        "type mismatch: expect '" + expected + "', actual '" + actual + "'"
    );
}

function wrongNumberOfArgumentsError(pos, expected, actual) {
    return new RuntimeError(
        pos,
        "wrong number of arguments: expected " + expected.toString() + ", actual " + actual.toString()
    );
}

function outOfRangeError(pos, index) {
    return new RuntimeError(
        pos,
        "index out of range: " + index.toString()
    );
}

function emptyArrayError(pos) {
    return new RuntimeError(
        pos,
        "empty array"
    );
}

var DataType = Object.freeze({
    "NUMBER"  : "number",
    "STRING"  : "string",
    "BOOLEAN" : "boolean",
    "VOID"    : "void",
    "FUNCTION": "function",
    "ARRAY"   : "array"
});

function Value(type, data) {
    this.type = type;
    this.data = data;
}

Value.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value"       : Value
    },
    "toString": {
        "value": function () {
            switch (this.type) {
                case DataType.NUMBER:
                    return this.data.toString();
                case DataType.STRING:
                    return lq.show(this.data);
                case DataType.BOOLEAN:
                    return this.data ? "true" : "false";
                case DataType.VOID:
                    return "void";
                case DataType.FUNCTION:
                    return "<function>";
                case DataType.ARRAY:
                    return "[" + this.data.map(function (value) { return value.toString(); }).join(", ") + "]";
                default:
                    return "<?>";
            }
        }
    }
});

var _void  = new Value(DataType.VOID, undefined);
var _true  = new Value(DataType.BOOLEAN, true);
var _false = new Value(DataType.BOOLEAN, false);


function Literal(pos, value) {
    this.pos   = pos;
    this.value = value;
}

Literal.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value"       : Literal
    },
    "evaluate": {
        "value": function (env) {
            return this.value;
        }
    }
});

function ArrayLiteral(pos, elements) {
    this.pos      = pos;
    this.elements = elements;
}
ArrayLiteral.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value"       : ArrayLiteral
    },
    "evaluate": {
        "value": function (env) {
            return new Value(
                DataType.ARRAY,
                this.elements.map(function (element) { return element.evaluate(env); })
            );
        }
    }
});

function Variable(pos, name) {
    this.pos  = pos;
    this.name = name;
}

Variable.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value"       : Variable
    },
    "evaluate": {
        "value": function (env) {
            if (env[this.name] !== undefined) {
                return env[this.name];
            }
            else {
                throw unboundError(this.pos, this.name);
            }
        }
    }
});

function Lambda(pos, argNames, body) {
    this.pos      = pos;
    this.argNames = argNames;
    this.body     = body;
}

Lambda.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value"       : Lambda
    },
    "evaluate": {
        "value": function (env) {
            // var pos      = this.pos;
            var argNames = this.argNames;
            var body     = this.body;
            return new Value(DataType.FUNCTION, function (_args) {
                var local = Object.create(env);
                local["arguments"] = new Value(DataType.ARRAY, _args);
                var numArgs = _args.length;
                for (var i = 0; i < argNames.length; i++) {
                    if (i < numArgs) {
                        local[argNames[i]] = _args[i];
                    }
                    else {
                        local[argNames[i]] = _void;
                    }
                }

                // try {
                    return body.evaluate(local);
                // }
                // catch (error) {
                //     throw new RuntimeError(pos, error.toString());
                // }
            });
        }
    }
});

function Application(pos, func, args) {
    this.pos  = pos;
    this.func = func;
    this.args = args;
}

Application.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value"       : Application
    },
    "evaluate": {
        "value": function (env) {
            var _func;
            var _args;
            // try {
                _func = this.func.evaluate(env);
                _args = this.args.map(function (arg) { return arg.evaluate(env); });
            // }
            // catch (error) {
            //     throw new RuntimeError(this.pos, error.toString());
            // }

            if (_func.type === DataType.FUNCTION) {
                try {
                    return _func.data(_args);
                }
                catch (error) {
                    throw new RuntimeError(this.pos, error.toString());
                }
            }
            else {
                throw invalidApplicationError(this.pos);
            }
        }
    }
});

function Procedure(pos, exprs) {
    this.pos   = pos;
    this.exprs = exprs;
}

Procedure.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value"       : Procedure
    },
    "evaluate": {
        "value": function (env) {
            var _result;
            // try {
                for (var i = 0; i < this.exprs.length; i++) {
                    _result = this.exprs[i].evaluate(env);
                }
            // }
            // catch (error) {
            //     throw new RuntimeError(this.pos, error.toString());
            // }
            return _result;
        }
    }
});

function Declaration(pos, name, expr) {
    this.pos  = pos;
    this.name = name;
    this.expr = expr;
}

Declaration.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value"       : Declaration
    },
    "evaluate": {
        "value": function (env) {
            var _value;
            // try {
                _value = this.expr.evaluate(env);
            // }
            // catch (error) {
            //     throw new RuntimeError(this.pos, error.toString());
            // }

            // if (env[this.name] === undefined) {
                env[this.name] = _value;
            // }
            // else {
            //     throw new RuntimeError(this.pos, "multiple definition: " + this.name);
            // }

            return _void;
        }
    }
});

function IfElse(pos, test, consequent, alternative) {
    this.pos         = pos;
    this.test        = test;
    this.consequent  = consequent;
    this.alternative = alternative;
}

IfElse.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value"       : IfElse
    },
    "evaluate": {
        "value": function (env) {
            var _test;
            // try {
                _test = this.test.evaluate(env);
            // }
            // catch (error) {
            //     throw new RuntimeError(this.pos, error.toString());
            // }

            if (_test.type === DataType.BOOLEAN) {
                // try {
                    if (_test.data === false) {
                        if (this.alternative !== undefined) {
                            return this.alternative.evaluate(env);
                        }
                        else {
                            return _void;
                        }
                    }
                    else {
                        return this.consequent.evaluate(env);
                    }
                // }
                // catch (error) {
                //     throw new RuntimeError(this.pos, error.toString());
                // }
            }
            else {
                throw typeError(this.pos, DataType.BOOLEAN, _test.type);
            }
        }
    }
});

function While(pos, test, statement) {
    this.pos       = pos;
    this.test      = test;
    this.statement = statement;
}

While.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value"       : While
    },
    "evaluate": {
        "value": function (env) {
            var _result = _void;
            while (true) {
                var _test;
                // try {
                    _test = this.test.evaluate(env);
                // }
                // catch (error) {
                //     throw new RuntimeError(this.pos, error.toString());
                // }

                if (_test.type === DataType.BOOLEAN) {
                    // try {
                        if (_test.data === false) {
                            return _result;
                        }
                        else {
                            _result = this.statement.evaluate(env);
                        }
                    // }
                    // catch (error) {
                    //     throw new RuntimeError(this.pos, error.toString());
                    // }
                }
                else {
                    throw new RuntimeError(this.pos, "type error");
                }
            }
        }
    }
});


var prelude = Object.create(null);
prelude["print"] = new Value(DataType.FUNCTION, function (_args) {
    for (var i = 0; i < _args.length; i++) {
        console.log(_args[i].toString());
    }
    return _void;
});
prelude["id"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    return _args[0].data;
});
prelude["negate"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, -_args[0].data);
});
prelude["flip"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.FUNCTION) { throw typeError(undefined, DataType.FUNCTION, _args[0].type); }
    return new Value(DataType.FUNCTION, function (__args) {
        return _args[0].data(__args.reverse());
    });
});
prelude["pi"] = new Value(DataType.NUMBER, Math.PI);
prelude["abs"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.abs(_args[0].data));
});
prelude["ceil"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.ceil(_args[0].data));
});
prelude["floor"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.floor(_args[0].data));
});
prelude["round"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.round(_args[0].data));
});
prelude["max"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.NUMBER, Math.max(_args[0].data, _args[1].data));
});
prelude["min"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.NUMBER, Math.min(_args[0].data, _args[1].data));
});
prelude["sin"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.sin(_args[0].data));
});
prelude["cos"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.cos(_args[0].data));
});
prelude["tan"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.tan(_args[0].data));
});
prelude["asin"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.asin(_args[0].data));
});
prelude["acos"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.acos(_args[0].data));
});
prelude["atan"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.atan(_args[0].data));
});
prelude["atan2"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.NUMBER, Math.atan2(_args[0].data, _args[1].data));
});
prelude["sqrt"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.sqrt(_args[0].data));
});
prelude["exp"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.exp(_args[0].data));
});
prelude["log"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.log(_args[0].data));
});
prelude["length"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.STRING) { throw typeError(undefined, DataType.STRING, _args[0].type); }
    return new Value(DataType.NUMBER, _args[0].data.length);
});
prelude["not"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.BOOLEAN) { throw typeError(undefined, DataType.BOOLEAN, _args[0].type); }
    return new Value(DataType.BOOLEAN, !_args[0].data);
});
prelude["newArray"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    var length = Math.max(Math.floor(_args[0].data), 0);
    var array = new Array(length);
    for (var i = 0; i < length; i++) {
        array[i] = _void;
    }
    return new Value(DataType.ARRAY, array);
});
prelude["arrayLength"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[0].type); }
    return new Value(DataType.NUMBER, _args[0].data.length);
});
prelude["writeArray"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 3) { throw wrongNumberOfArgumentsError(undefined, 3, _args.length); }
    if (_args[0].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    var index = Math.floor(_args[1].data);
    var length = _args[0].data.length;
    if (index < 0 || length <= index) { throw outOfRangeError(undefined, index); }
    _args[0].data[index] = _args[2];
    return _void;
});
prelude["readArray"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    var index = Math.floor(_args[1].data);
    var length = _args[0].data.length;
    if (index < 0 || length <= index) { throw outOfRangeError(undefined, index); }
    return _args[0].data[index];
});
prelude["push"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[0].type); }
    _args[0].data.push(_args[1]);
    return _void;
});
prelude["pop"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[0].type); }
    if (_args[0].length === 0) { throw emptyArrayError(undefined); }
    return _args[0].data.pop();
});
prelude["unshift"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[0].type); }
    _args[0].data.unshift(_args[1]);
    return _void;
});
prelude["shift"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[0].type); }
    if (_args[0].length === 0) { throw emptyArrayError(undefined); }
    return _args[0].data.shift();
});
prelude["_!!_"] = prelude["readArray"];
prelude["_._"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.FUNCTION) { throw typeError(undefined, DataType.FUNCTION, _args[0].type); }
    if (_args[1].type !== DataType.FUNCTION) { throw typeError(undefined, DataType.FUNCTION, _args[1].type); }
    return new Value(DataType.FUNCTION, function (__args) {
        return _args[0].data([_args[1].data(__args)]);
    });
});
prelude["_**_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.NUMBER, Math.pow(_args[0].data, _args[1].data));
});
prelude["_*_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.NUMBER, _args[0].data * _args[1].data);
});
prelude["_/_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.NUMBER, _args[0].data / _args[1].data);
});
prelude["_%_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.NUMBER, _args[0].data % _args[1].data);
});
prelude["+_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, _args[0].data);
});
prelude["-_"] = prelude["negate"];
prelude["_+_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.NUMBER, _args[0].data + _args[1].data);
});
prelude["_-_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.NUMBER, _args[0].data - _args[1].data);
});
prelude["_++_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.STRING) { throw typeError(undefined, DataType.STRING, _args[0].type); }
    if (_args[1].type !== DataType.STRING) { throw typeError(undefined, DataType.STRING, _args[1].type); }
    return new Value(DataType.STRING, _args[0].data + _args[1].data);
});
prelude["_==_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== _args[1].type) { throw typeError(undefined, _args[0].type, _args[1].type); }
    return new Value(DataType.BOOLEAN, _args[0].data === _args[1].data);
});
prelude["_!=_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== _args[1].type) { throw typeError(undefined, _args[0].type, _args[1].type); }
    return new Value(DataType.BOOLEAN, _args[0].data !== _args[1].data);
});
prelude["_<_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.BOOLEAN, _args[0].data < _args[1].data);
});
prelude["_>_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.BOOLEAN, _args[0].data > _args[1].data);
});
prelude["_<=_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.BOOLEAN, _args[0].data <= _args[1].data);
});
prelude["_>=_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.BOOLEAN, _args[0].data >= _args[1].data);
});
prelude["_&&_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.BOOLEAN) { throw typeError(undefined, DataType.BOOLEAN, _args[0].type); }
    if (_args[1].type !== DataType.BOOLEAN) { throw typeError(undefined, DataType.BOOLEAN, _args[1].type); }
    return new Value(DataType.BOOLEAN, _args[0].data && _args[1].data);
});
prelude["_||_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.BOOLEAN) { throw typeError(undefined, DataType.BOOLEAN, _args[0].type); }
    if (_args[1].type !== DataType.BOOLEAN) { throw typeError(undefined, DataType.BOOLEAN, _args[1].type); }
    return new Value(DataType.BOOLEAN, _args[0].data || _args[1].data);
});
prelude["_$_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.FUNCTION) { throw typeError(undefined, DataType.FUNCTION, _args[0].type); }
    return _args[0].data([_args[1]]);
});

function Loader() {

}

Loader.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value"       : Loader
    },
    "load": {
        "value": function (script) {
            var parseResult = parse(script);
            if (parseResult.succeeded) {
                run(prelude, parseResult.value);
            }
            else {
                console.log(parseResult.error.toString());
            }
        }
    }
});


function parse(script) {
    var langDef = new lq.LanguageDef(
        "{-",
        "-}",
        "--",
        true,
        lq.letter,
        lq.alphaNum.or(lq.oneOf("_'")),
        lq.oneOf(":!#$%&*+./<=>?@\\^|-~"),
        lq.oneOf(":!#$%&*+./<=>?@\\^|-~"),
        ["true", "false", "void", "if", "then", "else", "while", "do", "let", "lambda"],
        [":", "=", "\\", "->"],
        true
    );
    var tokenParser = lq.makeTokenParser(langDef);

    var operand = new lq.LazyParser(function () {
        return declaration
            .or(term)
            .or(lambda)
            .or(ifElse)
            .or(whileLoop)
            .or(procedure);
    }).label("operand");

    var factor = new lq.LazyParser(function () {
        return literal
            .or(variable)
            .or(tokenParser.parens(expression));
    });

    var term = lq.getPosition.bind(function (pos) {
        return factor.many1()
            .bind(function (factors) {
                if (factors.length === 1) {
                    return lq.pure(factors[0]);
                }
                else {
                    return lq.pure(new Application(pos, factors[0], factors.slice(1)));
                }
            });
    });

    function prefixOp(op) {
        return lq.getPosition.bind(function (pos) {
            return tokenParser.reservedOp(op)
                .then(lq.pure(function (x) {
                    return new Application(pos, new Variable(pos, op + "_"), [x])
                }));
        });
    }
    function infixOp(op) {
        return lq.getPosition.bind(function (pos) {
            return tokenParser.reservedOp(op)
                .then(lq.pure(function (x, y) {
                    return new Application(pos, new Variable(pos, "_" + op + "_"), [x, y])
                }));
        });
    }
    var expression = lq.buildExpressionParser(
        [
            [
                new lq.Operator(
                    lq.OperatorType.INFIX,
                    infixOp("!!"),
                    lq.OperatorAssoc.ASSOC_LEFT
                ),
                new lq.Operator(
                    lq.OperatorType.INFIX,
                    infixOp("."),
                    lq.OperatorAssoc.ASSOC_RIGHT
                )
            ],
            [
                new lq.Operator(
                    lq.OperatorType.INFIX,
                    infixOp("**"),
                    lq.OperatorAssoc.ASSOC_RIGHT
                )
            ],
            [
                new lq.Operator(
                    lq.OperatorType.INFIX,
                    infixOp("*"),
                    lq.OperatorAssoc.ASSOC_LEFT
                ),
                new lq.Operator(
                    lq.OperatorType.INFIX,
                    infixOp("/"),
                    lq.OperatorAssoc.ASSOC_LEFT
                ),
                new lq.Operator(
                    lq.OperatorType.INFIX,
                    infixOp("%"),
                    lq.OperatorAssoc.ASSOC_LEFT
                ),
            ],
            [
                new lq.Operator(
                    lq.OperatorType.PREFIX,
                    prefixOp("+")
                ),
                new lq.Operator(
                    lq.OperatorType.PREFIX,
                    prefixOp("-")
                ),
                new lq.Operator(
                    lq.OperatorType.INFIX,
                    infixOp("+"),
                    lq.OperatorAssoc.ASSOC_LEFT
                ),
                new lq.Operator(
                    lq.OperatorType.INFIX,
                    infixOp("-"),
                    lq.OperatorAssoc.ASSOC_LEFT
                ),
            ],
            [
                new lq.Operator(
                    lq.OperatorType.INFIX,
                    infixOp("++"),
                    lq.OperatorAssoc.ASSOC_RIGHT
                )
            ],
            [
                new lq.Operator(
                    lq.OperatorType.INFIX,
                    infixOp("=="),
                    lq.OperatorAssoc.ASSOC_NONE
                ),
                new lq.Operator(
                    lq.OperatorType.INFIX,
                    infixOp("!="),
                    lq.OperatorAssoc.ASSOC_NONE
                ),
                new lq.Operator(
                    lq.OperatorType.INFIX,
                    infixOp("<"),
                    lq.OperatorAssoc.ASSOC_NONE
                ),
                new lq.Operator(
                    lq.OperatorType.INFIX,
                    infixOp(">"),
                    lq.OperatorAssoc.ASSOC_NONE
                ),
                new lq.Operator(
                    lq.OperatorType.INFIX,
                    infixOp("<="),
                    lq.OperatorAssoc.ASSOC_NONE
                ),
                new lq.Operator(
                    lq.OperatorType.INFIX,
                    infixOp(">="),
                    lq.OperatorAssoc.ASSOC_NONE
                )
            ],
            [
                new lq.Operator(
                    lq.OperatorType.INFIX,
                    infixOp("&&"),
                    lq.OperatorAssoc.ASSOC_RIGHT
                )
            ],
            [
                new lq.Operator(
                    lq.OperatorType.INFIX,
                    infixOp("||"),
                    lq.OperatorAssoc.ASSOC_RIGHT
                )
            ],
            [
                new lq.Operator(
                    lq.OperatorType.INFIX,
                    infixOp("$"),
                    lq.OperatorAssoc.ASSOC_RIGHT
                )
            ]
        ],
        operand
    ).label("expression");

    var reverseProc = lq.getPosition.bind(function (pos) {
        return expression.sepEndBy1(tokenParser.symbol(":"))
            .bind(function (exprs) {
                return lq.pure(new Procedure(pos, exprs.reverse()));
            });
    });
    var proc = lq.getPosition.bind(function (pos) {
        return reverseProc.sepEndBy(tokenParser.symbol(";").or(tokenParser.whiteSpace))
            .bind(function (exprs) {
                return lq.pure(new Procedure(pos, exprs));
            });
    });

    var program = tokenParser.whiteSpace.right(proc).left(lq.eof);

    var numValue = tokenParser.naturalOrFloat.bind(function (natOrFloat) {
        return lq.pure(new Value(DataType.NUMBER, natOrFloat[natOrFloat.length === 1 ? 0 : 1]));
    }).label("number");
    var strValue = tokenParser.stringLiteral.bind(function (str) {
        return lq.pure(new Value(DataType.STRING, str));
    }).label("string");
    var trueValue = tokenParser.reserved("true").then(lq.pure(_true)).label("true");
    var falseValue = tokenParser.reserved("false").then(lq.pure(_false)).label("false");
    var boolValue = trueValue.or(falseValue).label("boolean");
    var voidValue = tokenParser.reserved("void").then(lq.pure(_void)).label("void");
    var literalValue = numValue.or(strValue).or(boolValue).or(voidValue);
    var primLiteral = lq.getPosition.bind(function (pos) {
        return literalValue.bind(function (value) {
            return lq.pure(new Literal(pos, value));
        });
    }).label("primitive");
    var arrayLiteral = lq.getPosition.bind(function (pos) {
        return tokenParser.brackets(tokenParser.commaSep(expression)).bind(function (elems) {
            return lq.pure(new ArrayLiteral(pos, elems));
        });
    }).label("array");
    var literal = primLiteral.or(arrayLiteral).label("literal");

    var identifier = lq.getPosition.bind(function (pos) {
        return tokenParser.identifier.bind(function (name) {
            return lq.pure(new Variable(pos, name));
        });
    }).label("identifier");
    var operator = lq.getPosition.bind(function (pos) {
        return tokenParser.parens(tokenParser.operator).try().bind(function (name) {
            return lq.pure(new Variable(pos, "_" + name + "_"));
        });
    }).label("operator");
    var variable = identifier.or(operator);

    var lambda = lq.getPosition.bind(function (pos) {
        return tokenParser.symbol("\\")
            .or(tokenParser.reserved("lambda"))
            .then(tokenParser.identifier.many())
            .bind(function (args) {
                return tokenParser.symbol("->")
                    .then(expression)
                    .bind(function (body) {
                        return lq.pure(new Lambda(pos, args, body));
                    });
            });
    }).label("lambda");

    var ifElse = lq.getPosition.bind(function (pos) {
        return tokenParser.reserved("if")
            .then(expression)
            .bind(function (test) {
                return tokenParser.reserved("then")
                    .then(expression)
                    .bind(function (consequent) {
                        return tokenParser.reserved("else")
                            .then(expression)
                            .bind(function (alternative) {
                                return lq.pure(new IfElse(pos, test, consequent, alternative));
                            })
                            .or(lq.pure(new IfElse(pos, test, consequent)));
                    });
            });
    }).label("if else");

    var whileLoop = lq.getPosition.bind(function (pos) {
        return tokenParser.reserved("while")
            .then(expression)
            .bind(function (test) {
                return tokenParser.reserved("do")
                    .then(expression)
                    .bind(function (statement) {
                        return lq.pure(new While(pos, test, statement));
                    });
            });
    }).label("while");

    var declaration = lq.getPosition.bind(function (pos) {
        return tokenParser.identifier
            .bind(function (name) {
                return tokenParser.symbol("=")
                    .then(expression)
                    .bind(function (expr) {
                        return lq.pure(new Declaration(pos, name, expr));
                    });
            }).try();
    }).label("declaration");

    var procedure = tokenParser.braces(proc).label("procedure");

    return lq.parse(program, "", script);
}

function run(prelude, program) {
    var global = Object.create(prelude);
    // try {
        console.log(program.evaluate(global));
    // }
    // catch (error) {
    //     // runtime error
    //     console.error(error);
    // }
}

end();
