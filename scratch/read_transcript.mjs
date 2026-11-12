import fs from 'fs';
import readline from 'readline';

const fileStream = fs.createReadStream('C:/Users/Nguyen The Duy/.gemini/antigravity/brain/8f1b85c4-5e41-4cb5-926a-d5a885557c08/.system_generated/logs/transcript_full.jsonl');
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

let found = false;
let userStep = 0;
for await (const line of rl) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT' && obj.content?.includes('Cho hình chóp S.ABC')) {
      console.log('Found user question at step', obj.step_index);
      userStep = obj.step_index;
      found = true;
    } else if (found && obj.type === 'PLANNER_RESPONSE' && obj.content) {
      console.log('Model response at step', obj.step_index);
      console.log('CONTENT:\n', obj.content);
      break;
    }
  } catch (_) {}
}
