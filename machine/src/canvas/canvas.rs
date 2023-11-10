use snafu::ensure;
use crate::canvas::block::BlockData::{MachineBlock, PixelBlock};
use crate::canvas::error::CanvasError::{BlockNotFound, DisconnectedPort, MachineError};
use crate::{Action, Message, Router};
use super::block::{Block, BlockData};
use super::error::{BlockNotFoundSnafu, CannotWireToItselfSnafu, CanvasError, MachineNotFoundSnafu};
use super::wire::{Port, Wire};

type Errorable = Result<(), CanvasError>;

#[derive(Debug, Clone)]
pub struct Canvas {
    pub blocks: Vec<Block>,
    pub wires: Vec<Wire>,
    pub router: Router,
}

impl Canvas {
    pub fn new() -> Canvas {
        Canvas {
            blocks: vec![],
            wires: vec![],
            router: Router::new(),
        }
    }

    pub fn block_id(&self) -> u16 {
        self.blocks.len() as u16
    }

    pub fn add_machine(&mut self) -> Result<u16, CanvasError> {
        let id = self.block_id();
        self.router.add_with_id(id);
        self.add_block_with_id(id, MachineBlock { machine_id: id })?;

        Ok(id)
    }

    pub fn add_block(&mut self, data: BlockData) -> Result<u16, CanvasError> {
        let id = self.block_id();
        self.add_block_with_id(id, data)?;

        Ok(id)
    }

    pub fn add_block_with_id(&mut self, id: u16, data: BlockData) -> Errorable {
        // Validate block data before adding them.
        match data {
            MachineBlock { machine_id } => {
                ensure!(self.router.get(machine_id).is_some(), MachineNotFoundSnafu { id: machine_id });
            }
            _ => {}
        }

        self.blocks.push(Block::new(id, data));
        Ok(())
    }

    pub fn connect(&mut self, source: Port, target: Port) -> Result<u16, CanvasError> {
        ensure!(source != target, CannotWireToItselfSnafu { port: source });

        // Do not add duplicate wires.
        if let Some(w) = self.wires.iter().find(|w| w.source == source || w.target == target) {
            return Ok(w.id);
        }

        // Source block must exist.
        ensure!(
            self.blocks.iter().any(|b| b.id == source.block),
            BlockNotFoundSnafu { id: source.block },
        );

        // Target block must exist.
        ensure!(
            self.blocks.iter().any(|b| b.id == target.block),
            BlockNotFoundSnafu { id: target.block },
        );

        let id = self.wires.len() as u16;
        self.wires.push(Wire { id, source, target });
        Ok(id)
    }

    pub fn get_block(&mut self, id: u16) -> Result<&Block, CanvasError> {
        self.blocks.iter().find(|b| b.id == id).ok_or(BlockNotFound { id })
    }

    pub fn mut_block(&mut self, id: u16) -> Result<&mut Block, CanvasError> {
        self.blocks.iter_mut().find(|b| b.id == id).ok_or(BlockNotFound { id })
    }

    pub fn tick(&mut self) -> Errorable {
        let ids: Vec<u16> = self.blocks.iter().map(|b| b.id).collect();

        self.route_messages()?;

        for id in ids {
            self.tick_block(id)?
        }

        if !self.router.is_halted() {
            self.router.step().map_err(|cause| MachineError { cause })?;
        }

        Ok(())
    }

    pub fn tick_block(&mut self, id: u16) -> Errorable {
        let block = self.mut_block(id)?;
        let messages = block.consume_messages();

        match &block.data {
            MachineBlock { .. } => {}
            PixelBlock { .. } => self.tick_pixel_block(id, messages)?
        }

        Ok(())
    }

    pub fn tick_pixel_block(&mut self, id: u16, messages: Vec<Message>) -> Errorable {
        let block = self.mut_block(id)?;
        let PixelBlock { pixels } = &mut block.data else { return Ok(()); };

        for message in messages {
            match message.action {
                // The "data" action is used to directly set the pixel data.
                Action::Data { body } => {
                    pixels.clear();
                    pixels.extend(&body);
                }
            }
        }

        Ok(())
    }

    pub fn port_target(&self, port: Port) -> Option<u16> {
        Some(self.wires.iter().find(|w| w.source == port)?.target.block)
    }

    /// Run every machine until all halts.
    pub fn run(&mut self) -> Errorable {
        self.router.ready();

        for _ in 1..1000 {
            if self.router.is_halted() { break; }
            self.tick()?;
        }

        self.tick()?;

        Ok(())
    }

    fn route_messages(&mut self) -> Errorable {
        // Collect the messages from the blocks and the machines.
        let mut messages = self.consume_messages();
        messages.extend(self.router.consume_messages());

        for message in messages {
            let recipient_id = self.port_target(message.port).ok_or(DisconnectedPort { port: message.port })?;

            if let Ok(block) = self.mut_block(recipient_id) {
                match block.data {
                    // Send the message directly to the machine.
                    MachineBlock { machine_id } => {
                        if let Some(m) = self.router.get_mut(machine_id) {
                            m.inbox.push(message);
                        }
                    }

                    _ => block.inbox.push(message)
                }
            }
        }

        Ok(())
    }

    fn consume_messages(&mut self) -> Vec<Message> {
        self.blocks.iter_mut().flat_map(|block| block.outbox.drain(..)).collect()
    }
}
