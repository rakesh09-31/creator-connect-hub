async function check() {
  for (const port of [8080, 8081, 5173, 3000]) {
    try {
      const res = await fetch(`http://localhost:${port}`);
      console.log(`Port ${port}: ${res.status}`);
    } catch (e) {
      console.log(`Port ${port}: failed (${e.message})`);
    }
  }
}
check();
