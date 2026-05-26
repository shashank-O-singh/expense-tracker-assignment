let total = 0;

function addExpense() {
  const title = document.getElementById("title").value;
  const amount = parseInt(document.getElementById("amount").value);

  if (!title || !amount) {
    alert("Enter valid data");
    return;
  }

  const li = document.createElement("li");
  li.textContent = `${title} - ₹${amount}`;

  document.getElementById("expense-list").appendChild(li);

  total += amount;

  document.getElementById("total").textContent = total;

  document.getElementById("title").value = "";
  document.getElementById("amount").value = "";
}
