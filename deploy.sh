# CF 로그인 및 ORG 선택 후 실행
npm run build:mta

if [ $? -eq 0 ];then
    cp ./uimodule/dist/sap-ui-cachebuster-info.json ./uimodule/webapp/
    echo "Build OK!"
else
    echo "Build Failure!"
    exit 9
fi

npm run deploy

rm ./uimodule/webapp/sap-ui-cachebuster-info.json
