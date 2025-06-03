const express = require('express')//khai báo thư viện
const app = express()//giả lập 1 sever
const port = 3000

app.get('/', (req, res) => {//http://localhost:3000/trang_chu nếu không /trang_chu thì sẽ là http://localhost:3000/
    res.send('Hello World!')
})//app.get: định nghĩa phương thức get của sever

app.listen(port, () => {//khởi động sever
    console.log(`Example app listening on port http://localhost:${port}`)
})//chạy dòng lệnh này nó sẽ ra 1 link sever, dán link đấy lên gg để truy cập vào web(nội dung trong app.get)