use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use machine::{Event, Execute, Machine, Parser};

#[wasm_bindgen]
pub struct Controller {
    #[wasm_bindgen(skip)]
    pub machines: Vec<Machine>
}

#[derive(Serialize, Deserialize)]
pub struct RunResult {
    pub stack: Vec<u16>,
    pub events: Vec<Event>
}

#[wasm_bindgen]
impl Controller {
    pub fn create() -> Controller {
        Controller {
            machines: vec![]
        }
    }

    pub fn add(&mut self) -> u16 {
        let m = Machine::new();
        let id = self.id();
        self.machines.push(m);
        id
    }

    pub fn id(&self) -> u16 {
        self.machines.len() as u16
    }

    fn get_mut(&mut self, id: u16) -> &mut Machine {
        self.machines.get_mut(id as usize).expect("cannot get machine")
    }

    fn get(&self, id: u16) -> &Machine {
        self.machines.get(id as usize).expect("cannot get machine")
    }

    pub fn run(&mut self, id: u16, source: &str) -> Result<JsValue, JsValue> {
        let parser: Parser = source.into();

        let m = self.get_mut(id);
        m.mem.load_symbols(parser.symbols);
        m.mem.load_code(parser.ops);
        m.run();

        let stack = m.mem.read_stack(10);
        let events = m.events.clone();
        let result = RunResult { stack, events };

        Ok(serde_wasm_bindgen::to_value(&result)?)
    }

    pub fn read_stack(&self, id: u16, size: u16) -> Result<JsValue, JsValue> {
        let m = self.get(id);
        let stack = m.mem.read_stack(size);

        Ok(serde_wasm_bindgen::to_value(&stack)?)
    }
}