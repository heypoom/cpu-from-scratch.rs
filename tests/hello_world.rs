#[cfg(test)]
mod tests {
    extern crate opcodes_to_algorithms as O;

    use mockall::{automock, predicate::*};
    use O::{Machine, Execute, Op, WithStringManager};

    #[cfg_attr(test, automock)]
    trait Printer {
        fn print(&self, s: &str);
    }

    #[test]
    fn test_print_hello_world() {
        let mut m = Machine::new();

        let mut strings = m.mem.string();
        let h_addr = strings.add_str("hello, ");
        let w_addr = strings.add_str("world!");

        m.mem.load_code(vec![Op::LoadString(h_addr), Op::Print, Op::LoadString(w_addr), Op::Print]);

        let mut mock = MockPrinter::new();
        mock.expect_print().with(eq("hello, ")).times(1).return_const(());
        mock.expect_print().with(eq("world!")).times(1).return_const(());

        let print = move |s: &_| mock.print(s);
        m.handlers.print.push(Box::new(print));

        m.run();
        assert_eq!(m.mem.read_stack(1), [0], "stack should be empty");
    }
}