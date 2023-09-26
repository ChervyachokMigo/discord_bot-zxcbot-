module.exports = {
    key_timeout: 150000,
    mail_db_path: 'data/mail_db',
    api_requests_path: 'modules/webserver/subdomains/api_requests',
    mailRegex: /(?:(?![a-zA-Z0-9_]{1}[a-zA-Z0-9_.-]*[a-zA-Z0-9_-]*).)/gi,
    dateRegex: /[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{4}\.\b(txt|html|empty)/gi
}