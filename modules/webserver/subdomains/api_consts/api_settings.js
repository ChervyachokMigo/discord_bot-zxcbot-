module.exports = {
    auth_key_digits_base_length: 6,
    auth_key_digits_extra_length: 2.499,
    token_length: 32,
    mail_db_key_length: 32,
    key_timeout: 150000,
    mail_db_path: 'data/mail_db',
    mail_addressee_max_length: 100,
    api_requests_path: 'modules/webserver/subdomains/api_requests',
    token_literals: '0123456789abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    mailRegex: /(?:(?![a-zA-Z0-9_]{1}[a-zA-Z0-9_.-]*[a-zA-Z0-9_-]*).)/gi,
    dateRegex: /[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{4}\.\b(txt|html|empty)/gi,
    postKeyRegex: /(?:(?![a-zA-Z0-9_]*).)/gi, 
    mail_ignore_list: [
        'jcom.home.ne.jp',
        'tiscali.it',
        'centrefile7@gmail.com'
    ],
}