let defaultHalls = [
  { name: "Royal Palace Hall", price: 50000, capacity: 500, img: "./images/hall1.jpg" },
  { name: "Golden Party Hall", price: 30000, capacity: 300, img: "./images/hall2.jpg" },
  { name: "Budget Celebration Hall", price: 15000, capacity: 200, img: "./images/hall3.jpg" }
];

let adminUsers = [
  { username: "admin1", password: "12345" },
  { username: "admin2", password: "12345" }
];

function loadHallDropdown() {
  let hallSelect = document.getElementById("hall");
  if (!hallSelect) return;

  let halls = JSON.parse(localStorage.getItem("halls")) || defaultHalls;
  localStorage.setItem("halls", JSON.stringify(halls));

  hallSelect.innerHTML = `<option value="">--Select--</option>`;

  halls.forEach(h => {
    hallSelect.innerHTML += `<option value="${h.name}" data-price="${h.price}">${h.name} (₹${h.price})</option>`;
  });

  let selectedHall = localStorage.getItem("selectedHall");
  if (selectedHall) {
    hallSelect.value = selectedHall;
    updatePrice();
  }
}

function selectHall(hallName, hallPrice) {
  localStorage.setItem("selectedHall", hallName);
  localStorage.setItem("selectedPrice", hallPrice);
  window.location.href = "booking.html";
}

function getLayoutPrice(layout) {
  if (layout === "Wedding") return 10000;
  if (layout === "Birthday") return 5000;
  if (layout === "Corporate") return 8000;
  return 0;
}

function getSlotPrice(slot) {
  if (slot === "Morning") return 0;
  if (slot === "Evening") return 2000;
  if (slot === "Full Day") return 5000;
  return 0;
}

function updatePrice() {
  let hall = document.getElementById("hall");
  let days = document.getElementById("days");
  let layout = document.getElementById("layout");
  let slot = document.getElementById("slot");

  if (!hall || hall.value === "") return;

  let hallPrice = parseInt(hall.options[hall.selectedIndex].getAttribute("data-price"));
  let totalDays = parseInt(days.value);

  let layoutPrice = getLayoutPrice(layout.value);
  let slotPrice = getSlotPrice(slot.value);

  let total = (hallPrice * totalDays) + layoutPrice + slotPrice;

  document.getElementById("totalPrice").value = "₹" + total;
}

function isHallAvailable(hallName, date) {
  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  return !bookings.some(b => b.hallName === hallName && b.date === date && b.bookingStatus !== "Rejected" && b.bookingStatus !== "Cancelled");
}

function checkReminders() {
  let user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user) return;

  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  let today = new Date();
  let tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  let tomorrowDate = tomorrow.toISOString().split("T")[0];

  bookings.forEach(b => {
    if (b.email === user.email && b.date === tomorrowDate && b.bookingStatus === "Approved") {
      alert("Reminder: Your event is tomorrow! Booking ID: " + b.bookingId);
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  loadHallDropdown();
  checkReminders();

  let bookingForm = document.getElementById("bookingForm");

  if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();

      let mobile = document.getElementById("mobile").value;
      let hall = document.getElementById("hall").value;
      let date = document.getElementById("date").value;
      let slot = document.getElementById("slot").value;
      let layout = document.getElementById("layout").value;
      let days = document.getElementById("days").value;

      if (mobile.length != 10) {
        alert("Mobile number must be 10 digits!");
        return;
      }

      if (!document.getElementById("termsCheck").checked) {
        alert("Please accept Terms & Conditions!");
        return;
      }

      if (!isHallAvailable(hall, date)) {
        alert("Hall already booked on this date! Choose another date.");
        return;
      }

      let user = JSON.parse(localStorage.getItem("loggedInUser"));

      let hallSelect = document.getElementById("hall");
      let hallPrice = parseInt(hallSelect.options[hallSelect.selectedIndex].getAttribute("data-price"));

      let totalAmount = (hallPrice * parseInt(days)) + getLayoutPrice(layout) + getSlotPrice(slot);

      let bookingId = "BK" + Date.now();
      let createdAt = new Date().toLocaleString();

      let booking = {
        bookingId,
        userName: user.name,
        email: user.email,
        mobile: user.mobile,
        hallName: hall,
        date,
        slot,
        layout,
        days,
        totalAmount,
        bookingStatus: "Pending",
        paymentStatus: "Pending",
        createdAt
      };

      let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
      bookings.push(booking);
      localStorage.setItem("bookings", JSON.stringify(bookings));

      localStorage.setItem("currentPaymentBookingId", bookingId);

      window.location.href = "payment.html";
    });
  }
});

function loadPaymentDetails() {
  let bookingId = localStorage.getItem("currentPaymentBookingId");
  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  let booking = bookings.find(b => b.bookingId === bookingId);

  if (!booking) return;

  document.getElementById("payBookingId").innerText = booking.bookingId;
  document.getElementById("payHall").innerText = booking.hallName;
  document.getElementById("payLayout").innerText = booking.layout;
  document.getElementById("paySlot").innerText = booking.slot;
  document.getElementById("payAmount").innerText = "₹" + booking.totalAmount;
}

function confirmPayment() {
  let bookingId = localStorage.getItem("currentPaymentBookingId");
  let method = document.getElementById("paymentMethod").value;

  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

  bookings.forEach(b => {
    if (b.bookingId === bookingId) {
      b.paymentStatus = "Paid (" + method + ")";
    }
  });

  localStorage.setItem("bookings", JSON.stringify(bookings));

  alert("Payment Successful! Confirmation sent to Email (Demo).");
  window.location.href = "mybookings.html";
}

function loadUserBookings() {
  let user = JSON.parse(localStorage.getItem("loggedInUser"));

  if (!user) {
    alert("Please login first!");
    window.location.href = "login.html";
    return;
  }

  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  let userBookings = bookings.filter(b => b.email === user.email);

  let list = document.getElementById("userBookingList");
  if (!list) return;

  list.innerHTML = "";

  if (userBookings.length === 0) {
    list.innerHTML = `<tr><td colspan="11">No Bookings Found</td></tr>`;
    return;
  }

  userBookings.forEach(b => {
    let refundText = "N/A";

    if (b.bookingStatus === "Cancelled") {
      refundText = (b.refundStatus || "Refund Applied") + " (₹" + (b.refundAmount || 0) + ")";
    }

    list.innerHTML += `
      <tr>
        <td>${b.bookingId}</td>
        <td>${b.hallName}</td>
        <td>${b.date}</td>
        <td>${b.slot}</td>
        <td>${b.layout}</td>
        <td>${b.days}</td>
        <td>₹${b.totalAmount}</td>
        <td>${b.bookingStatus}</td>
        <td>${b.paymentStatus}</td>
        <td>${refundText}</td>
        <td>
          <button onclick="cancelBooking('${b.bookingId}')">Cancel</button>
          <button onclick="printBooking('${b.bookingId}')">Receipt</button>
          <button onclick="openInvitation('${b.bookingId}')">Invitation</button>
          <button onclick="openTicket('${b.bookingId}')">Ticket</button>
        </td>
      </tr>
    `;
  });
}

function cancelBooking(bookingId) {
  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  let booking = bookings.find(b => b.bookingId === bookingId);

  if (!booking) {
    alert("Booking not found!");
    return;
  }

  let today = new Date();
  let eventDate = new Date(booking.date);

  let diffTime = eventDate - today;
  let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let refundPercent = 0;

  if (diffDays >= 7) refundPercent = 100;
  else if (diffDays >= 3) refundPercent = 50;
  else refundPercent = 0;

  let refundAmount = Math.floor((booking.totalAmount * refundPercent) / 100);

  booking.bookingStatus = "Cancelled";
  booking.refundStatus = refundPercent + "% Refund";
  booking.refundAmount = refundAmount;

  localStorage.setItem("bookings", JSON.stringify(bookings));

  alert(
    "Booking Cancelled!\nRefund Policy Applied: " +
    refundPercent +
    "%\nRefund Amount: ₹" +
    refundAmount
  );

  loadUserBookings();
}

function printBooking(bookingId) {
  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  let b = bookings.find(x => x.bookingId === bookingId);

  if (!b) return;

  let receipt = `
Booking Receipt
Booking ID: ${b.bookingId}
Name: ${b.userName}
Email: ${b.email}
Hall: ${b.hallName}
Date: ${b.date}
Slot: ${b.slot}
Layout: ${b.layout}
Days: ${b.days}
Total Amount: ₹${b.totalAmount}
Status: ${b.bookingStatus}
Payment: ${b.paymentStatus}
`;

  alert(receipt);
  window.print();
}

function loadAdminDashboard() {
  let bookingList = document.getElementById("bookingList");
  if (!bookingList) return;

  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

  document.getElementById("totalBookings").innerText = "Total Bookings: " + bookings.length;

  let revenue = 0;
  bookings.forEach(b => {
    if (String(b.paymentStatus).includes("Paid")) revenue += parseInt(b.totalAmount);
  });

  document.getElementById("totalRevenue").innerText = "Total Revenue: ₹" + revenue;

  bookingList.innerHTML = "";

  let hallCount = {};

  bookings.forEach((b, index) => {
    hallCount[b.hallName] = (hallCount[b.hallName] || 0) + 1;

    bookingList.innerHTML += `
      <tr>
        <td>${b.bookingId}</td>
        <td>${b.userName}</td>
        <td>${b.email}</td>
        <td>${b.mobile}</td>
        <td>${b.hallName}</td>
        <td>${b.date}</td>
        <td>${b.slot}</td>
        <td>${b.layout}</td>
        <td>₹${b.totalAmount}</td>
        <td>${b.bookingStatus}</td>
        <td>${b.paymentStatus}</td>
        <td>
          <button onclick="updateStatus(${index}, 'Approved')">Approve</button>
          <button onclick="updateStatus(${index}, 'Rejected')">Reject</button>
          <button onclick="deleteBooking(${index})">Delete</button>
        </td>
      </tr>
    `;
  });

  let labels = Object.keys(hallCount);
  let values = Object.values(hallCount);

  new Chart(document.getElementById("hallChart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{ label: "Most Booked Hall", data: values }]
    }
  });

  let revenueData = bookings.map(b => parseInt(b.totalAmount));
  let bookingIds = bookings.map(b => b.bookingId);

  new Chart(document.getElementById("revenueChart"), {
    type: "line",
    data: {
      labels: bookingIds,
      datasets: [{ label: "Revenue", data: revenueData }]
    }
  });
}

function addHall(event) {
  event.preventDefault();

  let name = document.getElementById("newHallName").value;
  let capacity = document.getElementById("newHallCapacity").value;
  let price = document.getElementById("newHallPrice").value;
  let img = document.getElementById("newHallImg").value;

  if (img.trim() === "") img = "./images/hall1.jpg";

  let halls = JSON.parse(localStorage.getItem("halls")) || defaultHalls;
  halls.push({ name, capacity, price, img });

  localStorage.setItem("halls", JSON.stringify(halls));
  alert("New Hall Added Successfully!");
  event.target.reset();
}

function updateStatus(index, status) {
  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  bookings[index].bookingStatus = status;
  localStorage.setItem("bookings", JSON.stringify(bookings));
  location.reload();
}

function deleteBooking(index) {
  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  bookings.splice(index, 1);
  localStorage.setItem("bookings", JSON.stringify(bookings));
  location.reload();
}

function adminLogin(event) {
  event.preventDefault();

  let user = document.getElementById("adminUser").value;
  let pass = document.getElementById("adminPass").value;

  let found = adminUsers.find(a => a.username === user && a.password === pass);

  if (found) {
    localStorage.setItem("adminLoggedIn", "true");
    window.location.href = "admin.html";
  } else {
    alert("Invalid Username or Password!");
  }
}

function checkAdmin() {
  let loggedIn = localStorage.getItem("adminLoggedIn");
  if (loggedIn !== "true") window.location.href = "admin-login.html";
}

function logoutAdmin() {
  localStorage.removeItem("adminLoggedIn");
  window.location.href = "admin-login.html";
}

function signupUser(event) {
  event.preventDefault();

  let name = document.getElementById("signupName").value;
  let email = document.getElementById("signupEmail").value;
  let mobile = document.getElementById("signupMobile").value;
  let pass = document.getElementById("signupPass").value;

  let users = JSON.parse(localStorage.getItem("users")) || [];

  if (users.find(u => u.email === email)) {
    alert("User already exists!");
    return;
  }

  users.push({ name, email, mobile, pass });
  localStorage.setItem("users", JSON.stringify(users));

  alert("Signup successful!");
  window.location.href = "login.html";
}

function loginUser(event) {
  event.preventDefault();

  let email = document.getElementById("loginEmail").value;
  let pass = document.getElementById("loginPass").value;

  let users = JSON.parse(localStorage.getItem("users")) || [];
  let user = users.find(u => u.email === email && u.pass === pass);

  if (user) {
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    window.location.href = "index.html";
  } else {
    alert("Invalid Email or Password!");
  }
}

function logoutUser() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "index.html";
}

function sendAIChat() {
  let input = document.getElementById("chatInput");
  let chatBox = document.getElementById("chatBox");

  if (!input.value.trim()) return;

  let userMsg = input.value.trim();
  chatBox.innerHTML += `<div class="chat-msg user-msg">${userMsg}</div><br>`;

  let msg = userMsg.toLowerCase();

  let halls = JSON.parse(localStorage.getItem("halls")) || defaultHalls;
  let reply = "Sorry, I didn’t understand. Please ask about booking, halls, payment, refund, ticket, or event type.";

  if (msg.includes("hi") || msg.includes("hello") || msg.includes("hey")) {
    reply = "Hello! 😊 Welcome to Online Event Hall Booking. How can I help you?";
  }

  else if (msg.includes("halls") || msg.includes("available halls") || msg.includes("hall list")) {
    reply = "Available halls:\n";
    halls.forEach(h => {
      reply += `✅ ${h.name} | Price: ₹${h.price}/day | Capacity: ${h.capacity}\n`;
    });
  }

  else if (msg.includes("price") || msg.includes("cost") || msg.includes("charges") || msg.includes("rate")) {
    reply = "Hall prices:\n";
    halls.forEach(h => {
      reply += `💰 ${h.name}: ₹${h.price}/day\n`;
    });
    reply += "\nExtra charges:\nWedding Layout: +₹10000\nBirthday Layout: +₹5000\nCorporate Layout: +₹8000\nEvening Slot: +₹2000\nFull Day Slot: +₹5000";
  }

  else if (msg.includes("capacity") || msg.includes("people") || msg.includes("guest")) {
    reply = "Hall capacities:\n";
    halls.forEach(h => {
      reply += `👥 ${h.name}: ${h.capacity} guests\n`;
    });
  }

  else if (msg.includes("wedding")) {
    reply = "For Wedding events, Royal Palace Hall is best because it has high capacity and premium decoration setup.";
  }

  else if (msg.includes("birthday")) {
    reply = "For Birthday parties, Golden Party Hall is the best choice with beautiful lighting and mid budget.";
  }

  else if (msg.includes("corporate") || msg.includes("meeting")) {
    reply = "For Corporate events, Royal Palace Hall is recommended. Corporate layout is available with extra ₹8000.";
  }

  else if (msg.includes("book") || msg.includes("booking process") || msg.includes("how to book")) {
    reply = "Booking steps:\n1) Signup/Login\n2) Go to Book Now\n3) Select Hall, Date, Slot, Layout\n4) Accept Terms\n5) Pay Payment\n6) Get Ticket & Invitation in My Bookings.";
  }

  else if (msg.includes("payment") || msg.includes("pay")) {
    reply = "Payment options available (Demo):\n✅ UPI\n✅ Card\n✅ Cash\nAfter payment, your booking will show Paid status in My Bookings.";
  }

  else if (msg.includes("ticket")) {
    reply = "After booking, go to My Bookings and click on Ticket button. You can download/print your Entry Pass with QR.";
  }

  else if (msg.includes("invitation")) {
    reply = "After booking, go to My Bookings and click Invitation button to generate your invitation card.";
  }

  else if (msg.includes("cancel") || msg.includes("cancellation")) {
    reply = "Cancellation Rules:\n✅ 7+ days before event: 100% refund\n✅ 3-6 days before: 50% refund\n✅ 0-2 days before: No refund\nRefund amount will be shown in My Bookings.";
  }

  else if (msg.includes("refund")) {
    reply = "Refund depends on event date:\n7+ days before = 100%\n3-6 days = 50%\n0-2 days = 0%\nRefund amount is shown after cancellation.";
  }

  else if (msg.includes("under 20000") || msg.includes("20k")) {
    reply = "Best hall under ₹20,000 is Budget Celebration Hall (₹15,000/day).";
  }

  else if (msg.includes("under 30000") || msg.includes("30k")) {
    reply = "Best hall under ₹30,000 is Golden Party Hall (₹30,000/day).";
  }

  else if (msg.includes("contact") || msg.includes("owner") || msg.includes("phone") || msg.includes("number")) {
    reply = "Owner Contact:\n📞 +91 70123 45678\n📧 vanshevent@gmail.com";
  }

  else if (msg.includes("thanks") || msg.includes("thank you")) {
    reply = "You're welcome 😊 Happy to help!";
  }

  setTimeout(() => {
    chatBox.innerHTML += `<div class="chat-msg bot-msg">${reply}</div><br>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 600);

  input.value = "";
}

function submitFeedback(event) {
  event.preventDefault();

  let name = document.getElementById("fbName").value;
  let email = document.getElementById("fbEmail").value;
  let message = document.getElementById("fbMessage").value;

  let feedbacks = JSON.parse(localStorage.getItem("feedbacks")) || [];

  feedbacks.push({
    name: name,
    email: email,
    message: message,
    date: new Date().toLocaleString()
  });

  localStorage.setItem("feedbacks", JSON.stringify(feedbacks));

  document.getElementById("fbMsg").innerText = "Feedback Submitted Successfully!";
  document.getElementById("feedbackForm").reset();
}

function loadFeedbacks() {
  let feedbackList = document.getElementById("feedbackList");
  if (!feedbackList) return;

  let feedbacks = JSON.parse(localStorage.getItem("feedbacks")) || [];
  feedbackList.innerHTML = "";

  if (feedbacks.length === 0) {
    feedbackList.innerHTML = `<tr><td colspan="4">No Feedback Found</td></tr>`;
    return;
  }

  feedbacks.forEach(f => {
    feedbackList.innerHTML += `
      <tr>
        <td>${f.name}</td>
        <td>${f.email}</td>
        <td>${f.message}</td>
        <td>${f.date}</td>
      </tr>
    `;
  });
}

function recommendHall() {
  let eventType = document.getElementById("eventType").value;
  let guests = parseInt(document.getElementById("guestCount").value);
  let budget = parseInt(document.getElementById("budget").value);

  let halls = JSON.parse(localStorage.getItem("halls")) || defaultHalls;
  let bestHall = null;

  halls.forEach(h => {
    if (guests <= h.capacity && budget >= h.price) {
      if (!bestHall || h.price > bestHall.price) bestHall = h;
    }
  });

  if (bestHall) {
    document.getElementById("recommendResult").innerHTML =
      `Recommended Hall: <b>${bestHall.name}</b><br>
      Event Type: <b>${eventType}</b><br>
      Capacity: <b>${bestHall.capacity}</b><br>
      Price/Day: <b>₹${bestHall.price}</b>`;
  } else {
    document.getElementById("recommendResult").innerHTML =
      "No hall matches your budget and guest count.";
  }
}

function openInvitation(bookingId) {
  localStorage.setItem("currentPaymentBookingId", bookingId);
  window.location.href = "invitation.html";
}

function loadInvitationCard() {
  let bookingId = localStorage.getItem("currentPaymentBookingId");
  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  let booking = bookings.find(b => b.bookingId === bookingId);

  if (!booking) return;

  document.getElementById("invEvent").innerText = "Event Type: " + booking.layout;
  document.getElementById("invName").innerText = "Guest Name: " + booking.userName;
  document.getElementById("invHall").innerText = "Venue: " + booking.hallName;
  document.getElementById("invDate").innerText = "Date: " + booking.date;
  document.getElementById("invSlot").innerText = "Slot: " + booking.slot;
}

function openTicket(bookingId) {
  localStorage.setItem("ticketBookingId", bookingId);
  window.location.href = "ticket.html";
}

function loadTicket() {
  let bookingId = localStorage.getItem("ticketBookingId");
  let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  let booking = bookings.find(b => b.bookingId === bookingId);

  if (!booking) return;

  document.getElementById("tBookingId").innerText = booking.bookingId;
  document.getElementById("tName").innerText = booking.userName;
  document.getElementById("tHall").innerText = booking.hallName;
  document.getElementById("tDate").innerText = booking.date;
  document.getElementById("tSlot").innerText = booking.slot;
  document.getElementById("tLayout").innerText = booking.layout;
}