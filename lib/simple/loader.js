/*
 * CometJS / simple / loader.js
 * copyright (c) 2015 Susisu
 */

"use strict";

function end () {
    module.exports = Object.freeze({
    });
}

var lq = require("loquat");

var comet = {
    "simple": {
        "source": require("./source.js")
    }
};


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
            // var expr = parse(script);
        }
    }
});


function parse(script) {

}

function run(prelude, expr) {
    var global = Object.create(prelude);
    try {
        expr.evaluate(global);
    }
    catch (error) {
        // runtime error
        console.error(error);
    }
}


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
            return this.pos.toString() + ":\n" + this.message;
        }
    }
});


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
                throw new RuntimeError(this.pos, "unbound variable: " + this.name);
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
                throw new RuntimeError(this.pos, "invalid application");
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
                throw new RuntimeError(this.pos, "type error");
            }
        }
    }
});

function While(pos, test, expr) {
    this.pos  = pos;
    this.test = test;
    this.expr = expr;
}

While.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value"       : While
    },
    "evaluate": {
        "value": function (env) {
            var _result;
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
                            _result = this.expr.evaluate(env);
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


end();
