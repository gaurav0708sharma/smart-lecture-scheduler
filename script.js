const teacherList = document.getElementById("teacherList");
const addTeacherBtn = document.getElementById("addTeacherBtn");
const generateBtn = document.getElementById("generateBtn");
const sampleBtn = document.getElementById("sampleBtn");
const clearBtn = document.getElementById("clearBtn");
const printBtn = document.getElementById("printBtn");
const downloadBtn = document.getElementById("downloadBtn");
const output = document.getElementById("output");
const resultInfo = document.getElementById("resultInfo");

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function createTeacherRow(name = "", subject = "") {
  const row = document.createElement("div");
  row.className = "teacher-row";

  row.innerHTML = `
    <input type="text" class="teacher-name" placeholder="Teacher Name (e.g. Amit Sir)" value="${name}" />
    <input type="text" class="teacher-subject" placeholder="Subject (e.g. DBMS)" value="${subject}" />
    <button class="remove-btn">Remove</button>
  `;

  row.querySelector(".remove-btn").addEventListener("click", () => row.remove());
  teacherList.appendChild(row);
}

createTeacherRow();
createTeacherRow();
createTeacherRow();

addTeacherBtn.addEventListener("click", () => createTeacherRow());

sampleBtn.addEventListener("click", () => {
  document.getElementById("className").value = "BCA 2nd Year";
  document.getElementById("sections").value = "A, B, C";

  document.getElementById("mon").value = 6;
  document.getElementById("tue").value = 5;
  document.getElementById("wed").value = 4;
  document.getElementById("thu").value = 6;
  document.getElementById("fri").value = 5;
  document.getElementById("sat").value = 2;

  teacherList.innerHTML = "";
  createTeacherRow("Amit Sir", "DBMS");
  createTeacherRow("Neha Ma'am", "Web Development");
  createTeacherRow("Rahul Sir", "Python");
  createTeacherRow("Priya Ma'am", "Operating System");
  createTeacherRow("Vikas Sir", "Computer Networks");
  createTeacherRow("Anjali Ma'am", "Software Engineering");
});

clearBtn.addEventListener("click", () => {
  document.getElementById("className").value = "";
  document.getElementById("sections").value = "";

  document.getElementById("mon").value = 5;
  document.getElementById("tue").value = 5;
  document.getElementById("wed").value = 5;
  document.getElementById("thu").value = 5;
  document.getElementById("fri").value = 5;
  document.getElementById("sat").value = 0;

  teacherList.innerHTML = "";
  createTeacherRow();
  createTeacherRow();
  createTeacherRow();

  output.innerHTML = "";
  resultInfo.textContent = 'Fill the details and click "Generate Timetable".';
  printBtn.classList.add("hidden");
  downloadBtn.classList.add("hidden");
});

generateBtn.addEventListener("click", generateTimetable);
printBtn.addEventListener("click", () => window.print());
downloadBtn.addEventListener("click", downloadTimetable);

function getTeachers() {
  const rows = document.querySelectorAll(".teacher-row");
  const teachers = [];

  rows.forEach(row => {
    const name = row.querySelector(".teacher-name").value.trim();
    const subject = row.querySelector(".teacher-subject").value.trim();

    if (name && subject) {
      teachers.push({ name, subject });
    }
  });

  return teachers;
}

function getDayWiseLectures() {
  return [
    parseInt(document.getElementById("mon").value) || 0,
    parseInt(document.getElementById("tue").value) || 0,
    parseInt(document.getElementById("wed").value) || 0,
    parseInt(document.getElementById("thu").value) || 0,
    parseInt(document.getElementById("fri").value) || 0,
    parseInt(document.getElementById("sat").value) || 0
  ];
}

function generateTimetable() {
  const className = document.getElementById("className").value.trim();
  const sectionsInput = document.getElementById("sections").value.trim();
  const teachers = getTeachers();
  const dayWiseLectures = getDayWiseLectures();

  output.innerHTML = "";
  printBtn.classList.add("hidden");
  downloadBtn.classList.add("hidden");

  if (!className || !sectionsInput || teachers.length === 0) {
    output.innerHTML = `<div class="error">Please fill class name, sections, and at least one teacher with subject.</div>`;
    resultInfo.textContent = "Please complete the form.";
    return;
  }

  const sections = sectionsInput
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  if (sections.length === 0) {
    output.innerHTML = `<div class="error">Please enter valid section names (e.g. A, B, C).</div>`;
    resultInfo.textContent = "Invalid sections.";
    return;
  }

  const totalWeeklyLectures = dayWiseLectures.reduce((sum, count) => sum + count, 0);

  if (totalWeeklyLectures === 0) {
    output.innerHTML = `<div class="error">Please enter at least one lecture for any day.</div>`;
    resultInfo.textContent = "No lectures found.";
    return;
  }

  const maxPeriods = Math.max(...dayWiseLectures);

  const teacherBusy = Array.from({ length: days.length }, () =>
    Array.from({ length: maxPeriods }, () => new Set())
  );

  const schedules = {};

  sections.forEach(section => {
    schedules[section] = Array.from({ length: days.length }, (_, d) =>
      Array.from({ length: dayWiseLectures[d] }, () => null)
    );
  });

  sections.forEach((section, sectionIndex) => {
    let rotationOffset = sectionIndex;

    for (let d = 0; d < days.length; d++) {
      let usedSubjectsToday = new Set();
      let usedTeachersToday = new Set();
      const lectureCount = dayWiseLectures[d];

      for (let p = 0; p < lectureCount; p++) {
        let assigned = false;

        const rotatedTeachers = [
          ...teachers.slice((rotationOffset + p + d) % teachers.length),
          ...teachers.slice(0, (rotationOffset + p + d) % teachers.length)
        ];

        for (let teacher of rotatedTeachers) {
          if (teacherBusy[d][p].has(teacher.name)) continue;
          if (usedTeachersToday.has(teacher.name)) continue;
          if (usedSubjectsToday.has(teacher.subject)) continue;

          schedules[section][d][p] = {
            subject: teacher.subject,
            teacher: teacher.name
          };

          teacherBusy[d][p].add(teacher.name);
          usedTeachersToday.add(teacher.name);
          usedSubjectsToday.add(teacher.subject);
          assigned = true;
          rotationOffset++;
          break;
        }

        if (!assigned) {
          schedules[section][d][p] = null;
        }
      }
    }
  });

  resultInfo.textContent = `Timetable generated successfully for ${className}. Same teacher is allowed only once per section per day.`;
  renderSchedules(className, sections, dayWiseLectures, maxPeriods, schedules);

  printBtn.classList.remove("hidden");
  downloadBtn.classList.remove("hidden");

  setTimeout(() => {
    document.querySelector(".result-card").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 150);
}

function renderSchedules(className, sections, dayWiseLectures, maxPeriods, schedules) {
  output.innerHTML = "";

  sections.forEach(section => {
    const block = document.createElement("div");
    block.className = "schedule-block";

    const title = document.createElement("h3");
    title.className = "schedule-title";
    title.textContent = `${className} - Section ${section}`;
    block.appendChild(title);

    const tableWrap = document.createElement("div");
    tableWrap.className = "table-wrap";

    const table = document.createElement("table");

    let thead = `<thead><tr><th>Day / Period</th>`;
    for (let p = 1; p <= maxPeriods; p++) {
      thead += `<th>Lecture ${p}</th>`;
    }
    thead += `</tr></thead>`;

    let tbody = `<tbody>`;

    for (let d = 0; d < days.length; d++) {
      tbody += `<tr><th>${days[d]} (${dayWiseLectures[d]})</th>`;

      for (let p = 0; p < maxPeriods; p++) {
        if (p < dayWiseLectures[d]) {
          const slot = schedules[section][d][p];

          if (slot) {
            tbody += `
              <td>
                <div class="slot">
                  <span class="subject">${slot.subject}</span>
                  <span class="teacher">${slot.teacher}</span>
                </div>
              </td>
            `;
          } else {
            tbody += `<td><span class="free">Free</span></td>`;
          }
        } else {
          tbody += `<td><span class="free">Free</span></td>`;
        }
      }

      tbody += `</tr>`;
    }

    tbody += `</tbody>`;

    table.innerHTML = thead + tbody;
    tableWrap.appendChild(table);
    block.appendChild(tableWrap);
    output.appendChild(block);
  });
}

function downloadTimetable() {
  const className = document.getElementById("className").value.trim() || "Class";
  const timetableHTML = output.innerHTML;

  if (!timetableHTML.trim()) {
    alert("Please generate the timetable first.");
    return;
  }

  const fileContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${className} Timetable</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background: #ffffff;
      color: #000000;
    }
    h1 {
      text-align: center;
      margin-bottom: 25px;
    }
    .schedule-block {
      margin-bottom: 30px;
    }
    .schedule-title {
      margin-bottom: 10px;
      font-size: 20px;
      color: #111827;
    }
    .table-wrap {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 800px;
    }
    th, td {
      border: 1px solid #999;
      padding: 10px;
      text-align: center;
    }
    th {
      background: #f3f4f6;
    }
    .slot {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .subject {
      font-weight: bold;
    }
    .teacher {
      color: #374151;
      font-size: 14px;
    }
    .free {
      color: #6b7280;
      font-style: italic;
    }
  </style>
</head>
<body>
  <h1>${className} Timetable</h1>
  ${timetableHTML}
</body>
</html>
  `;

  const blob = new Blob([fileContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${className.replace(/\s+/g, "_")}_Timetable.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}