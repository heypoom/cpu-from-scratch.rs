use serde::{Deserialize, Serialize};
use crate::{Event, Message};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub id: u16,

    pub data: BlockData,

    pub inbox: Vec<Message>,
    pub outbox: Vec<Message>,
    pub events: Vec<Event>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum BlockData {
    MachineBlock {
        machine_id: u16,
    },

    PixelBlock {
        pixels: Vec<u16>
    },
}

impl Block {
    pub fn new(id: u16, data: BlockData) -> Block {
        Block { id, data, inbox: vec![], outbox: vec![], events: vec![] }
    }

    pub fn consume_messages(&mut self) -> Vec<Message> {
        self.inbox.drain(..).collect()
    }
}
