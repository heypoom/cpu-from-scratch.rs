#[cfg(test)]
mod loop_tests {
    use machine::{Execute, Machine, Op};

    #[test]
    fn test_loop() {
        let mut m: Machine = vec![
            Op::Push(0), // i = 0
            Op::Push(2), // [loop_start]
            Op::Add,     // i += 2
            Op::Dup,     // B = i
            Op::Push(20), // A = 20
            Op::GreaterThanOrEqual, // 20 >= i?
            Op::JumpNotZero(1), // jump to [loop_start] if 20 >= i
            // i is now over 20. we are at the end of the loop.
            Op::Push(0xFF),
        ]
            .into();

        m.run();

        assert_eq!(m.mem.read_stack(2), [22, 255]);
    }
}