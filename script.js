var KEY = "scrapDonations";
function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch (e) {
    return [];
  }
}
function save(d) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
    return true;
  } catch (e) {
    return false;
  }
}
function $(id) {
  return document.getElementById(id);
}
function esc(s) {
  var d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

try {
  var base = location.href.split("#")[0];
  new QRCode($("qr"), {
    text: base + "#points",
    width: 168,
    height: 168,
    colorDark: "#1f2a24",
    colorLight: "#ffffff",
  });
} catch (e) {
  $("qr").textContent = "QR code unavailable";
}

$("weight").addEventListener("input", function () {
  var w = parseFloat(this.value);
  $("preview").textContent =
    w > 0
      ? "This donation earns " + Math.round(w * 10 * 100) / 100 + " points."
      : "";
});

$("form").addEventListener("submit", function (e) {
  e.preventDefault();
  var f = ["name", "contact", "sid", "grade", "section", "scrap", "weight"],
    v = {},
    msg = $("fmsg");
  for (var i = 0; i < f.length; i++) {
    v[f[i]] = $(f[i]).value.trim();
    if (!v[f[i]]) {
      msg.className = "msg err";
      msg.textContent = "Please fill in all fields.";
      $(f[i]).focus();
      return;
    }
  }
  var w = parseFloat(v.weight);
  if (!(w > 0)) {
    msg.className = "msg err";
    msg.textContent = "Weight must be more than 0 kg.";
    $("weight").focus();
    return;
  }
  var rec = {
    name: v.name,
    contact: v.contact,
    sid: v.sid,
    grade: v.grade,
    section: v.section,
    scrap: v.scrap,
    weight: w,
    points: Math.round(w * 10 * 100) / 100,
    date: new Date().toLocaleDateString(),
  };
  var d = load();
  d.push(rec);
  if (!save(d)) {
    msg.className = "msg err";
    msg.textContent = "Could not save. Check your browser's storage settings.";
    return;
  }
  msg.className = "msg ok";
  msg.textContent = "Donation submitted. You earned " + rec.points + " points.";
  $("form").reset();
  $("preview").textContent = "";
  $("lookup").value = v.sid;
  show(v.sid);
});

function show(id) {
  id = id.trim();
  var out = $("result");
  if (!id) {
    out.innerHTML = '<p class="msg err">Enter your student ID no.</p>';
    return;
  }
  var rows = load().filter(function (r) {
    return r.sid.toLowerCase() === id.toLowerCase();
  });
  if (!rows.length) {
    out.innerHTML =
      '<p class="msg err">No donations found for ID ' +
      esc(id) +
      ". Submit a donation above to start earning points.</p>";
    return;
  }
  var total = 0,
    kg = 0;
  rows.forEach(function (r) {
    total += r.points;
    kg += r.weight;
  });
  total = Math.round(total * 100) / 100;
  kg = Math.round(kg * 100) / 100;
  var h =
    '<div class="big" style="margin-top:16px">' +
    total +
    ' pts</div><p class="sub">' +
    kg +
    " kg donated in total</p>" +
    '<div class="scroll"><table><thead><tr><th>Student Name</th><th>Student ID</th><th>Date</th><th>Scrap</th><th>Kg</th><th>Points</th></tr></thead><tbody>';
  rows
    .slice()
    .reverse()
    .forEach(function (r) {
      h +=
        "<tr><td>" +
        esc(r.name) +
        "</td><td>" +
        esc(r.sid) +
        "</td><td>" +
        esc(r.date) +
        "</td><td>" +
        esc(r.scrap) +
        "</td><td>" +
        r.weight +
        "</td><td>" +
        r.points +
        "</td></tr>";
    });
  out.innerHTML = h + "</tbody></table></div>";
}
$("check").addEventListener("click", function () {
  show($("lookup").value);
});
$("lookup").addEventListener("keydown", function (e) {
  if (e.key === "Enter") show(this.value);
});
