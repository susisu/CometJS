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

function notImplementedError(pos, type) {
    return new RuntimeError(
        pos,
        "function not implemented for " + type
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
            var _result = _void;
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

            return _value;
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
                    throw typeError(this.pos, DataType.BOOLEAN, _test.type);
                }
            }
        }
    }
});


var prelude = Object.create(null);
// ... -> Void
prelude["print"] = new Value(DataType.FUNCTION, function (_args) {
    for (var i = 0; i < _args.length; i++) {
        console.log(_args[i].toString());
    }
    return _void;
});
// a -> a
prelude["id"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    return _args[0];
});
// Function -> Function
prelude["flip"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.FUNCTION) { throw typeError(undefined, DataType.FUNCTION, _args[0].type); }
    return new Value(DataType.FUNCTION, function (__args) {
        return _args[0].data(__args.slice().reverse());
    });
});
// Number -> Number
prelude["negate"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, -_args[0].data);
});
// Number
prelude["pi"] = new Value(DataType.NUMBER, Math.PI);
// Number -> Number
prelude["abs"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.abs(_args[0].data));
});
// Number -> Number
prelude["ceil"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.ceil(_args[0].data));
});
// Number -> Number
prelude["floor"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.floor(_args[0].data));
});
// Number -> Number
prelude["round"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.round(_args[0].data));
});
// Number -> Number -> Number
prelude["max"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.NUMBER, Math.max(_args[0].data, _args[1].data));
});
// Number -> Number -> Number
prelude["min"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.NUMBER, Math.min(_args[0].data, _args[1].data));
});
// Number -> Number
prelude["sin"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.sin(_args[0].data));
});
// Number -> Number
prelude["cos"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.cos(_args[0].data));
});
// Number -> Number
prelude["tan"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.tan(_args[0].data));
});
// Number -> Number
prelude["asin"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.asin(_args[0].data));
});
// Number -> Number
prelude["acos"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.acos(_args[0].data));
});
// Number -> Number
prelude["atan"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.atan(_args[0].data));
});
// Number -> Number -> Number
prelude["atan2"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.NUMBER, Math.atan2(_args[0].data, _args[1].data));
});
// Number -> Number
prelude["sqrt"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.sqrt(_args[0].data));
});
// Number -> Number
prelude["exp"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.exp(_args[0].data));
});
// Number -> Number
prelude["log"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, Math.log(_args[0].data));
});
// String -> Number
// Array -> Number
prelude["length"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    switch (_args[0].type) {
        case DataType.STRING:
            return new Value(DataType.NUMBER, _args[0].data.length);
        case DataType.ARRAY:
            return new Value(DataType.NUMBER, _args[0].data.length);
        default:
            throw notImplementedError(undefined, _args[0].type);
    }
});
// Boolean -> Boolean
prelude["not"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.BOOLEAN) { throw typeError(undefined, DataType.BOOLEAN, _args[0].type); }
    return new Value(DataType.BOOLEAN, !_args[0].data);
});
// Number -> Array
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
// Array -> Array
prelude["copyArray"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[0].type); }
    return new Value(DataType.ARRAY, _args[0].data.slice());
});
// Array -> Number -> a -> Void
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
// Array -> Number -> a
prelude["readArray"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    var index = Math.floor(_args[1].data);
    var length = _args[0].data.length;
    if (index < 0 || length <= index) { throw outOfRangeError(undefined, index); }
    return _args[0].data[index];
});
// Array -> a -> Void
prelude["push"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[0].type); }
    _args[0].data.push(_args[1]);
    return _void;
});
// Array -> a
prelude["pop"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[0].type); }
    if (_args[0].length === 0) { throw emptyArrayError(undefined); }
    return _args[0].data.pop();
});
// Array -> a -> Void
prelude["unshift"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[0].type); }
    _args[0].data.unshift(_args[1]);
    return _void;
});
// Array -> a
prelude["shift"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[0].type); }
    if (_args[0].length === 0) { throw emptyArrayError(undefined); }
    return _args[0].data.shift();
});
// Function -> Array -> Boolean
prelude["some"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.FUNCTION) { throw typeError(undefined, DataType.FUNCTION, _args[0].type); }
    if (_args[1].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[1].type); }
    return new Value(
        DataType.BOOLEAN,
        _args[1].data.some(function (elem) {
            var _test = _args[0].data([elem]);
            if (_test.type !== DataType.BOOLEAN) { throw typeError(undefined, DataType.BOOLEAN, _test.type); }
            return _test.data;
        })
    );
});
// Function -> Array -> Boolean
prelude["every"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.FUNCTION) { throw typeError(undefined, DataType.FUNCTION, _args[0].type); }
    if (_args[1].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[1].type); }
    return new Value(
        DataType.BOOLEAN,
        _args[1].data.every(function (elem) {
            var _test = _args[0].data([elem]);
            if (_test.type !== DataType.BOOLEAN) { throw typeError(undefined, DataType.BOOLEAN, _test.type); }
            return _test.data;
        })
    );
});
// Function -> Array -> Array
prelude["map"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.FUNCTION) { throw typeError(undefined, DataType.FUNCTION, _args[0].type); }
    if (_args[1].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[1].type); }
    return new Value(
        DataType.ARRAY,
        _args[1].data.map(function (elem) {
            return _args[0].data([elem]);
        })
    );
});
// Function -> Array -> Void
prelude["forEach"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[0].type); }
    if (_args[1].type !== DataType.FUNCTION) { throw typeError(undefined, DataType.FUNCTION, _args[1].type); }
    _args[0].data.forEach(function (elem) {
        return _args[1].data([elem]);
    });
    return _void;
});
// Function -> Array -> Array
prelude["filter"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.FUNCTION) { throw typeError(undefined, DataType.FUNCTION, _args[0].type); }
    if (_args[1].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[1].type); }
    return new Value(
        DataType.ARRAY,
        _args[1].data.filter(function (elem) {
            var _test = _args[0].data([elem]);
            if (_test.type !== DataType.BOOLEAN) { throw typeError(undefined, DataType.BOOLEAN, _test.type); }
            return _test.data;
        })
    );
});
// Function -> a -> Array -> b
prelude["foldl"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 3) { throw wrongNumberOfArgumentsError(undefined, 3, _args.length); }
    if (_args[0].type !== DataType.FUNCTION) { throw typeError(undefined, DataType.FUNCTION, _args[0].type); }
    if (_args[2].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[2].type); }
    return _args[2].data.reduce(
        function (accum, elem) { return _args[0].data([accum, elem]); },
        _args[1]
    );
});
// Function -> Array -> a
prelude["foldl1"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.FUNCTION) { throw typeError(undefined, DataType.FUNCTION, _args[0].type); }
    if (_args[1].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[1].type); }
    if (_args[1].data.length === 0) { throw emptyArrayError(undefined); }
    return _args[1].data.reduce(
        function (accum, elem) { return _args[0].data([accum, elem]); }
    );
});
// Function -> a -> Array -> b
prelude["foldr"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 3) { throw wrongNumberOfArgumentsError(undefined, 3, _args.length); }
    if (_args[0].type !== DataType.FUNCTION) { throw typeError(undefined, DataType.FUNCTION, _args[0].type); }
    if (_args[2].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[2].type); }
    return _args[2].data.reduceRight(
        function (accum, elem) { return _args[0].data([elem, accum]); },
        _args[1]
    );
});
// Function -> Array -> a
prelude["foldr1"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.FUNCTION) { throw typeError(undefined, DataType.FUNCTION, _args[0].type); }
    if (_args[1].type !== DataType.ARRAY) { throw typeError(undefined, DataType.ARRAY, _args[1].type); }
    if (_args[1].data.length === 0) { throw emptyArrayError(undefined); }
    return _args[1].data.reduceRight(
        function (accum, elem) { return _args[0].data([elem, accum]); }
    );
});
// Array -> Number -> a
prelude["_!!_"] = prelude["readArray"];
// Function -> Function -> Function
prelude["_._"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.FUNCTION) { throw typeError(undefined, DataType.FUNCTION, _args[0].type); }
    if (_args[1].type !== DataType.FUNCTION) { throw typeError(undefined, DataType.FUNCTION, _args[1].type); }
    return new Value(DataType.FUNCTION, function (__args) {
        return _args[0].data([_args[1].data(__args)]);
    });
});
// Number -> Number -> Number
prelude["_**_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.NUMBER, Math.pow(_args[0].data, _args[1].data));
});
// Number -> Number -> Number
prelude["_*_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.NUMBER, _args[0].data * _args[1].data);
});
// Number -> Number -> Number
prelude["_/_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.NUMBER, _args[0].data / _args[1].data);
});
// Number -> Number -> Number
prelude["_%_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.NUMBER, _args[0].data % _args[1].data);
});
// Number -> Number
prelude["+_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 1) { throw wrongNumberOfArgumentsError(undefined, 1, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    return new Value(DataType.NUMBER, _args[0].data);
});
// Number -> Number
prelude["-_"] = prelude["negate"];
// Number -> Number -> Number
prelude["_+_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.NUMBER, _args[0].data + _args[1].data);
});
// Number -> Number -> Number
prelude["_-_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[0].type); }
    if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
    return new Value(DataType.NUMBER, _args[0].data - _args[1].data);
});
// String -> String -> String
prelude["_++_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.STRING) { throw typeError(undefined, DataType.STRING, _args[0].type); }
    if (_args[1].type !== DataType.STRING) { throw typeError(undefined, DataType.STRING, _args[1].type); }
    return new Value(DataType.STRING, _args[0].data + _args[1].data);
});
// a -> a -> Boolean
prelude["_==_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== _args[1].type) { throw typeError(undefined, _args[0].type, _args[1].type); }
    return new Value(DataType.BOOLEAN, _args[0].data === _args[1].data);
});
// a -> a -> Boolean
prelude["_!=_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== _args[1].type) { throw typeError(undefined, _args[0].type, _args[1].type); }
    return new Value(DataType.BOOLEAN, _args[0].data !== _args[1].data);
});
// Number -> Number -> Boolean
// String -> String -> Boolean
prelude["_<_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    switch (_args[0].type) {
        case DataType.NUMBER:
            if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
            return new Value(DataType.BOOLEAN, _args[0].data < _args[1].data);
        case DataType.STRING:
            if (_args[1].type !== DataType.STRING) { throw typeError(undefined, DataType.STRING, _args[1].type); }
            return new Value(DataType.BOOLEAN, _args[0].data < _args[1].data);
        default:
            throw notImplementedError(undefined, _args[0].type);
    }
});
// Number -> Number -> Boolean
// String -> String -> Boolean
prelude["_>_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    switch (_args[0].type) {
        case DataType.NUMBER:
            if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
            return new Value(DataType.BOOLEAN, _args[0].data > _args[1].data);
        case DataType.STRING:
            if (_args[1].type !== DataType.STRING) { throw typeError(undefined, DataType.STRING, _args[1].type); }
            return new Value(DataType.BOOLEAN, _args[0].data > _args[1].data);
        default:
            throw notImplementedError(undefined, _args[0].type);
    }
});
// Number -> Number -> Boolean
// String -> String -> Boolean
prelude["_<=_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    switch (_args[0].type) {
        case DataType.NUMBER:
            if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
            return new Value(DataType.BOOLEAN, _args[0].data <= _args[1].data);
        case DataType.STRING:
            if (_args[1].type !== DataType.STRING) { throw typeError(undefined, DataType.STRING, _args[1].type); }
            return new Value(DataType.BOOLEAN, _args[0].data <= _args[1].data);
        default:
            throw notImplementedError(undefined, _args[0].type);
    }
});
// Number -> Number -> Boolean
// String -> String -> Boolean
prelude["_>=_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    switch (_args[0].type) {
        case DataType.NUMBER:
            if (_args[1].type !== DataType.NUMBER) { throw typeError(undefined, DataType.NUMBER, _args[1].type); }
            return new Value(DataType.BOOLEAN, _args[0].data >= _args[1].data);
        case DataType.STRING:
            if (_args[1].type !== DataType.STRING) { throw typeError(undefined, DataType.STRING, _args[1].type); }
            return new Value(DataType.BOOLEAN, _args[0].data >= _args[1].data);
        default:
            throw notImplementedError(undefined, _args[0].type);
    }
});
// Boolean -> Boolean -> Boolean
prelude["_&&_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.BOOLEAN) { throw typeError(undefined, DataType.BOOLEAN, _args[0].type); }
    if (_args[1].type !== DataType.BOOLEAN) { throw typeError(undefined, DataType.BOOLEAN, _args[1].type); }
    return new Value(DataType.BOOLEAN, _args[0].data && _args[1].data);
});
// Boolean -> Boolean -> Boolean
prelude["_||_"] = new Value(DataType.FUNCTION, function (_args) {
    if (_args.length !== 2) { throw wrongNumberOfArgumentsError(undefined, 2, _args.length); }
    if (_args[0].type !== DataType.BOOLEAN) { throw typeError(undefined, DataType.BOOLEAN, _args[0].type); }
    if (_args[1].type !== DataType.BOOLEAN) { throw typeError(undefined, DataType.BOOLEAN, _args[1].type); }
    return new Value(DataType.BOOLEAN, _args[0].data || _args[1].data);
});
// Function -> a -> b
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
        lq.oneOf("!#$%&*+./<=>?@\\^|-~"),
        lq.oneOf("!#$%&*+./<=>?@\\^|-~"),
        ["true", "false", "void", "if", "then", "else", "while", "do", "let", "in", "lambda"],
        ["=", "\\", "->"],
        true
    );
    var tokenParser = lq.makeTokenParser(langDef);

    var operandExpr = new lq.LazyParser(function () {
        return declaration
            .or(lambda)
            .or(letIn)
            .or(ifElse)
            .or(whileLoop)
            .or(procedureBlock)
            .or(application);
    }).label("expression");

    var valueExpr = new lq.LazyParser(function () {
        return literal
            .or(variable)
            .or(tokenParser.parens(expression));
    });
    var funcExpr = valueExpr.label("value or function");
    var argExpr = valueExpr.label("argument");
    var argsExpr = argExpr.many().label("arguments");
    var application = lq.getPosition.bind(function (pos) {
        return funcExpr.bind(function (func) {
            return argsExpr.bind(function (args) {
                if (args.length === 0) {
                    return lq.pure(func);
                }
                else {
                    return lq.pure(new Application(pos, func, args));
                }
            });
        });
    }).label("value or function application");

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
        operandExpr
    ).label("expression");

    var reverseProc = lq.getPosition.bind(function (pos) {
        return expression.sepEndBy1(tokenParser.symbol(":"))
            .bind(function (exprs) {
                return lq.pure(new Procedure(pos, exprs.slice().reverse()));
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
    var voidValue = tokenParser.reserved("void")
        .or(tokenParser.symbol("()").try())
        .then(lq.pure(_void)).label("void");
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
    var variable = identifier.or(operator).label("variable");

    var lambda = lq.getPosition.bind(function (pos) {
        return tokenParser.reservedOp("\\")
            .or(tokenParser.reserved("lambda"))
            .then(tokenParser.identifier.many())
            .bind(function (args) {
                return tokenParser.reservedOp("->")
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
            .left(tokenParser.reservedOp("="))
            .try()
            .bind(function (name) {
                return expression.bind(function (expr) {
                    return lq.pure(new Declaration(pos, name, expr));
                });
            });
    }).label("declaration");

    var letIn = lq.getPosition.bind(function (pos) {
        return tokenParser.reserved("let")
            .then(tokenParser.identifier)
            .bind(function (name) {
                return tokenParser.reservedOp("=")
                    .then(expression)
                    .bind(function (bindExpr) {
                        return tokenParser.reserved("in")
                            .then(expression)
                            .bind(function (expr) {
                                return lq.pure(new Application(pos, new Lambda(pos, [name], expr), [bindExpr]));
                            });
                    });
            });
    }).label("let in");

    var procedureBlock = tokenParser.braces(proc).label("procedure block");

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
