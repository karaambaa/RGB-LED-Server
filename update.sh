if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi


read -p "Do you wish to install lightberry and it's files? (y/n)" answer
case ${answer:0:1} in
    y|Y|yes|Yes|ja|Ja|si|Si|oui|Oui )
        sudo mkdir /bin/lightberry
        sudo cp -f server.py /bin/lightberry/
        sudo cp -f RGBlauncher.sh /bin/lightberry/
        read -p "Installer will remove files in /var/www/html and replace with the lightberry website, continue? (y/n)" answer
        case ${answer:0:1} in
            y|Y|yes|Yes|ja|Ja|si|Si|oui|Oui )
                sudo rm -r /var/www/html
                sudo cp -r html /var/www/
                sudo find /var/www/ -type d -exec chmod 755 {} \;
                sudo find /var/www/ -type f -exec chmod 644 {} \;
            ;;
            * )
                echo "stopped installation"
            ;;
        esac
    ;;
    * )
        echo "stopped installation"
    ;;
esac

echo "rebooting now"
sleep 2  # Waits 2 seconds.
sudo reboot now