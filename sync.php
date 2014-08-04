<?php

	$file = "listo_save_data.txt";

	if(!file_exists($file)){
		$fp = fopen( $file, "w" ) or die("Cannot open ".$file." for writing.");
		fwrite( $fp, '{}' );
		fclose( $fp );
	}

	if (isset($_POST['USER']){
		$fp = fopen( $file, "w" ) or die("Cannot open ".$file." for writing.");
		fwrite( $fp, $_POST['USER'] );
		fclose( $fp );
	}

	include $file;

?>