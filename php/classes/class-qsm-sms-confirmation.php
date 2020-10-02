<?php

class QSM_SmsConfirmation {
    private $key = '';
    private $enabled = false;

    function __construct() {
        $settings = (array) get_option( 'qmn-settings' );

        if (isset($settings['sms_confirmation'])) {
            $this->enabled = ($settings['sms_confirmation'] == '2');
        }

        if (isset($settings['sms_service_token'])) {
            $this->key = $settings['sms_service_token'];
        }
    }

    // /index.php?rest_route=/quiz-survey-master/v1/confirmation/send/79..
    // /index.php?rest_route=/quiz-survey-master/v1/confirmation/check/79../2071
    public function checkSmsConfirmationCode($phone, $code) {
        if ($this->enabled) {
            $result = ($code == self::getCodeDB($phone));
            return compact('result');
        }
    }

    public function sendConfirmationSms($phone) {
        if ($this->enabled) {
            $code = self::generateSmsConfirmationCode();
            if (self::setCodeDB($phone, $code)) {
                //$result = $this->sendSmsText($phone, $code);
                return compact('phone', 'result');
            }
        }
    }

    public static function setCodeDB($phone, $code) {
        global $wpdb;
        return $wpdb->insert( $wpdb->prefix . "mlw_sms_codes", array('phone' => $phone,'code' => $code,), array('%s','%s',) );
    }

    public static function getCodeDB($phone) {
        global $wpdb;
        $row = $wpdb->get_row( "SELECT code FROM {$wpdb->prefix}mlw_sms_codes WHERE phone = '{$phone}' ORDER BY ID DESC", 'ARRAY_A' );
        return $row ? $row['code'] : null;
    }

    public static function generateSmsConfirmationCode() {
        return rand(1000,9999);
    }

    private function sendSmsText($phone, $code) {
        // Ваш уникальный программный ключ, который можно получить на главной странице
        $smsru = new SMSRU($this->key);
        $data = new stdClass();
        $data->to = $phone;
        // https://sms.ru/codes
        $data->text = 'Ваш код подтверждения ' . $code;
        $sms = $smsru->send_one($data);
        return ($sms->status == "OK");
    }
}