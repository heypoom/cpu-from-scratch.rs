use serde::{Deserialize, Serialize};
use snafu::prelude::*;

#[derive(Debug, Snafu, Serialize, Deserialize, PartialEq, Clone)]
#[snafu(visibility(pub))]
pub enum ParseError {
    #[snafu(display("string is invalid"))]
    InvalidString,

    #[snafu(display("symbol is not defined"))]
    UndefinedSymbols,

    #[snafu(display("invalid identifier"))]
    InvalidIdentifier,

    #[snafu(display("instruction '{name}' does not exist!"))]
    UndefinedInstruction { name: String },

    #[snafu(display("label definition should end with :"))]
    InvalidLabelDescription,

    #[snafu(display("duplicate label definition"))]
    DuplicateLabelDefinition,

    #[snafu(display("duplicate string definition"))]
    DuplicateStringDefinition,

    #[snafu(display("invalid argument"))]
    InvalidArgument { errors: Vec<ParseError> },

    #[snafu(display("invalid string value"))]
    InvalidStringValue,

    #[snafu(display("invalid byte value"))]
    InvalidByteValue,

    #[snafu(display("invalid argument token"))]
    InvalidArgToken,

    #[snafu(display("cannot peek at a token"))]
    CannotPeekAtToken,

    #[snafu(display("peek exceeds source length"))]
    PeekExceedsSourceLength,

    #[snafu(display("invalid decimal digit"))]
    InvalidDecimalDigit { text: String },

    #[snafu(display("invalid hex digit"))]
    InvalidHexDigit { text: String },
}
