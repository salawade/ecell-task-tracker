fetch('/tasks')
.then(res => res.json())
.then(data => {

    let rows = "";

    data.forEach(task => {
        rows += `
        <tr>
            <td>${task.title}</td>
            <td>${task.description}</td>
            <td>${task.date}</td>
            <td>
                ${task.file_path 
                    ? `<a href="/uploads/${task.file_path}" target="_blank">View</a>` 
                    : "No File"}
            </td>
            <td>
                <a href="/delete/${task.id}" onclick="return confirm('Delete this task?')" style="color:red;">
                    Delete
                </a>
            </td>
        </tr>`;
    });

    document.getElementById("taskTable").innerHTML = rows;
});