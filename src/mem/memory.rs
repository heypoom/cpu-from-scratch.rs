pub const MEMORY_SIZE: u16 = 0xFFFF;

/**
 * Memory defines a fixed-size memory area for the program.
 */
#[derive(Debug)]
pub struct Memory {
    pub buffer: [u16; MEMORY_SIZE as usize],
}

impl Memory {
    pub fn new() -> Memory {
        Memory {
            buffer: [0; MEMORY_SIZE as usize],
        }
    }

    pub fn set(&mut self, addr: u16, val: u16) {
        self.buffer[addr as usize] = val;
    }

    pub fn get(&self, addr: u16) -> u16 {
        self.buffer[addr as usize]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_memset() {
        let mut m = Memory::new();

        m.set(0, 1);
        assert_eq!(m.get(0), 1);
        assert_eq!(m.get(1), 0);
    }
}
