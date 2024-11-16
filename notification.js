const mustache = require("mustache");
const fs = require("fs");
const { title } = require("process");
const { NodeHtmlMarkdown } = require("node-html-markdown");

const XSS_PAYLOAD_FIRE_EMAIL_TEMPLATE = fs.readFileSync(
  "./templates/xss_email_template.htm",
  "utf8"
);

async function send_discord_webhook_notification(msg) {
  if (!process.env.DISCORD_WEBHOOK_URL) {
    console.log("No Discord Webhook URL set, skipping notification");
    return;
  }

  const subject = msg.subject;
  const html_body = msg.html;
  // convert the html to markdown
  //   const markdown_body = turndownService.turndown(html_body);
  const markdown_body = NodeHtmlMarkdown.translate(html_body);
  const embed = {
    title: subject,
    description: markdown_body,
  };
  const body = {
    embeds: [embed],
    content: markdown_body,
  };

  const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return response;
}

async function send_notification(xss_payload_fire_data) {
  const notification_html_email_body = mustache.render(
    XSS_PAYLOAD_FIRE_EMAIL_TEMPLATE,
    xss_payload_fire_data
  );

  const fire_location = !xss_payload_fire_data.encrypted
    ? xss_payload_fire_data.url
    : "With An Encryption Key";

  const msg = {
    subject: `[XSS Hunter Express] XSS Payload Fired On ${fire_location}`,
    text: "Only HTML reports are available, please use an email client which supports this.",
    html: notification_html_email_body,
  };

  const response = await send_discord_webhook_notification(msg);

  console.debug("notification sent with status %d", response.status);
  return true;
}

module.exports.send_notification = send_notification;
