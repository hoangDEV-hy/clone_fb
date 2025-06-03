const express = require('express')//khai báo thư viện
const app = express()//giả lập 1 sever
const port = 3000
const handlebars = require('express-handlebars');
const path = require('path');

app.engine('hdbs', handlebars.engine({
    extname: '.hdbs',
}));//định nghĩa đuôi tệp(mặc định đuôi .handlebars thì không cần)

app.set('view engine', '.hdbs');
app.set('views', path.join(__dirname, 'resources', 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('body');
});

app.listen(port, () => {//khởi động sever
    console.log(`Example app listening on port http://localhost:${port}`)
})//chạy dòng lệnh này nó sẽ ra 1 link sever, dán link đấy lên gg để truy cập vào web(nội dung trong app.get)