const EmailTemplates = require("email-templates");
const path = require("path");
const fs = require("fs");

const emailTemplates = new EmailTemplates({
  views: {
    root: path.join(__dirname, "../templates"),
    options: {
      extension: "ejs",
    },
  },
  juice: true,
  juiceResources: {
    preserveImportant: true,
    webResources: {
      relativeTo: path.join(__dirname, "../templates"),
    },
  },
});

const renderTemplate = async (templateName, data) => {
  try {
    // Try to render both subject and html
    const result = await emailTemplates.renderAll(templateName, data);
    // Successfully rendered both subject and html
    return {
      subject: result.subject,
      html: result.html,
    };
  } catch (error) {
    // Fallback to manual rendering
    // Fallback: render HTML and read subject separately
    const html = await emailTemplates.render(templateName, data);
    const subjectPath = path.join(
      __dirname,
      "../templates",
      templateName,
      "subject.txt"
    );
    let subject = "";
    try {
      subject = fs.readFileSync(subjectPath, "utf8");
      // Render EJS template for subject
      const ejs = require("ejs");
      subject = ejs.render(subject, data);
    } catch (err) {
      console.warn("Could not read subject file:", err.message);
      subject = "Notification";
    }
    return {
      subject: subject.trim(),
      html: html,
    };
  }
};

module.exports = { renderTemplate };
