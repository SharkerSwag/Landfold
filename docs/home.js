if (["127.0.0.1", "localhost"].includes(location.hostname)) {
  const form = document.querySelector("#home-question");
  const question = document.querySelector("#home-question-text");
  const response = await fetch("api/agent").catch(() => null);
  if (response?.ok && (await response.json().catch(() => null))?.available) {
    form.hidden = false;
    document.querySelector("#home-availability").hidden = true;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const draft = question.value.trim();
      if (!draft) {
        question.focus();
        return;
      }
      try {
        sessionStorage.setItem("landfold-question-draft", draft);
      } catch {
        document.querySelector("#home-availability").textContent =
          "浏览器无法传递问题，请打开地理探究页填写。";
        document.querySelector("#home-availability").hidden = false;
        return;
      }
      location.href = "investigate.html?ask=1";
    });
  }
}
