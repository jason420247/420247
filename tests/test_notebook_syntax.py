import json
import ast
import glob
import pytest

def test_notebook_code_cells_syntax():
    notebooks = glob.glob("quickstarts/*.ipynb")
    assert notebooks, "No notebooks found in quickstarts/"

    errors = []
    for nb_path in notebooks:
        with open(nb_path, "r", encoding="utf-8") as f:
            nb = json.load(f)

        for i, cell in enumerate(nb.get("cells", [])):
            if cell.get("cell_type") == "code":
                source = "".join(cell.get("source", []))
                if not source.strip():
                    continue

                # Check for SyntaxError in outputs
                outputs = cell.get("outputs", [])
                has_recorded_syntax_error = False
                for output in outputs:
                    if output.get("output_type") == "error" and output.get("ename") == "SyntaxError":
                        has_recorded_syntax_error = True
                        break

                # Validate Python syntax
                lines = cell.get("source", [])
                python_lines = []
                for line in lines:
                    stripped = line.lstrip()
                    if stripped.startswith(("%", "!")):
                        # Simple heuristic for IPython magics and shell commands
                        continue
                    python_lines.append(line)

                python_code = "".join(python_lines)
                # Further cleaning: some cells might have inline magics or other things,
                # but ast.parse is a good baseline.

                syntax_error = None
                if python_code.strip():
                    try:
                        ast.parse(python_code)
                    except SyntaxError as e:
                        syntax_error = e

                if has_recorded_syntax_error or syntax_error:
                    error_msg = f"Cell {i} in {nb_path} has issues:\n"
                    if has_recorded_syntax_error:
                        error_msg += "  - Has a recorded SyntaxError in its outputs.\n"
                    if syntax_error:
                        error_msg += f"  - Python syntax error: {syntax_error}\n"
                    error_msg += f"Source snippet: {source[:100]}..."
                    errors.append(error_msg)

    if errors:
        pytest.fail("\n".join(errors))
