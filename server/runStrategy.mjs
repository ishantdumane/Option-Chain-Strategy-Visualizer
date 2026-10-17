import { spawn } from "child_process";

export function runStrategy(inputData) {
  return new Promise((resolve, reject) => {
    const py = spawn("python", ["strategies/strategy2.py"]);

    let data = "";
    py.stdout.on("data", (chunk) => (data += chunk.toString()));
    py.stderr.on("data", (err) => reject(err.toString()));

    py.on("close", () => {
      try {
        resolve(JSON.parse(data)); // Python must return JSON
      } catch (e) {
        reject("Invalid JSON from Python: " + data);
      }
    });

    py.stdin.write(JSON.stringify(inputData));
    py.stdin.end();
  });
}
