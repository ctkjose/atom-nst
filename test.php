<?php
class a {
function dothis($a, $b){


}
}

trait ezcReflectionReturnInfoLongLongLong {
    function getReturnType() { /*1*/ }
    function getReturnDescription() { /*2*/ }

	public function ezcDothis($a, $b){


	}
	public static function aStaticMethod() {
        // ...
    }
}
//#TODO Fix this error
class ezcReflectionMethod extends ReflectionMethod {
    use ezcReflectionReturnInfo;
    /* ... */
}
//#MARK Hello_is_here
$greet = function($name){
    printf("Hello %s\r\n", $name);
};
$example = function () use ($message) {
    var_dump($message);
};
?>
