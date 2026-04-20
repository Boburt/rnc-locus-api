import * as bcrypt from 'bcrypt';

const passwords = ['adminpass', 'normalpass', 'limitedpass'];
const SALT_ROUNDS = 10;

async function main() {
  for (const password of passwords) {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    console.log(`${password}: ${hash}`);
  }
}

main();