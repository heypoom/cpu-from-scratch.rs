#[cfg(test)]
mod parser_tests {
    use machine::{load_test_file, Op, Parser};

    #[test]
    fn test_parse_call_stack() {
        let p: Parser = (*load_test_file("call-stack-1.asm")).into();

        assert_eq!(p.symbols.offsets["start"], 9);
        assert_eq!(p.symbols.offsets["add_pattern"], 2);

        assert_eq!(p.ops[0], Op::Jump(9));
        assert_eq!(p.ops[5], Op::Call(2));
    }

    #[test]
    fn test_parse_strings() {
        let p: Parser = (*load_test_file("hello-world.asm")).into();

        assert_eq!(p.symbols.strings["hello_world"], "Hello, world!");
        assert_eq!(p.symbols.offsets["hello_world"], 0);

        assert_eq!(p.symbols.strings["foo"], "foo bar");
        assert_eq!(p.symbols.offsets["foo"], 14);

        assert_eq!(p.symbols.data["bar"][0], 0xDEAD);
        assert_eq!(p.symbols.data["baz"][0], 0xBEEF);
    }
}