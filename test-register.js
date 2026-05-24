const fetch = require("node-fetch");
async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "shravya",
        email: "shravya@gmail.com",
        password: "password123",
        companyCode: "ENTERPRISE2026",
        role: "EMPLOYEE",
        managerEmail: "project@manager.com"
      })
    });
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
  } catch(e) {
    console.error(e);
  }
}
test();
