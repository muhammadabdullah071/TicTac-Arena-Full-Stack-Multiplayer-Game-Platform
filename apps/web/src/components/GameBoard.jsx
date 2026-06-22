export default function GameBoard({
  board,
  onCellClick,
  winningLine,
  currentPlayer,
  disabled,
}) {
  const getCellClass = (index) => {
    const baseClass =
      "w-full h-full flex items-center justify-center text-4xl sm:text-5xl font-semibold cursor-pointer transition-all";

    if (disabled || board[index]) {
      return `${baseClass} cursor-not-allowed`;
    }

    return `${baseClass} hover:bg-white/5`;
  };

  const getCellValue = (index) => {
    if (!board[index]) return "";

    if (board[index] === "X") {
      return (
        <span
          className={
            winningLine?.includes(index) ? "text-[#22C55E]" : "text-[#6D28D9]"
          }
        >
          X
        </span>
      );
    }

    return (
      <span
        className={
          winningLine?.includes(index) ? "text-[#22C55E]" : "text-[#22D3EE]"
        }
      >
        O
      </span>
    );
  };

  return (
    <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-6">
      {/* Current Turn Indicator */}
      {!disabled && (
        <div className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 bg-[#1F2937] border border-[#E5E7EB]/10 rounded-lg px-4 py-2">
            <div
              className={`w-3 h-3 rounded-full ${currentPlayer === "X" ? "bg-[#6D28D9]" : "bg-[#22D3EE]"}`}
            ></div>
            <span className="text-sm text-white font-medium">
              {currentPlayer === "X" ? "Your Turn (X)" : "Opponent's Turn (O)"}
            </span>
          </div>
        </div>
      )}

      {/* Game Board Grid */}
      <div className="grid grid-cols-3 gap-3 aspect-square max-w-md mx-auto">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
          <div
            key={index}
            onClick={() => !disabled && !board[index] && onCellClick(index)}
            className={getCellClass(index)}
            style={{
              backgroundColor: winningLine?.includes(index)
                ? "rgba(34, 197, 94, 0.1)"
                : "rgba(31, 41, 55, 1)",
              border: "1px solid rgba(229, 231, 235, 0.1)",
              borderRadius: "12px",
            }}
          >
            {getCellValue(index)}
          </div>
        ))}
      </div>
    </div>
  );
}
