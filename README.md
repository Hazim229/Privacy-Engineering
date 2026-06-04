CARA NAK RUN

guna powershell
 Step 1: p kat folder yng nak guna
Example:
cd Desktop

(or any folder you want)


 Step 2: Clone the project:
git clone https://github.com/Hazim229/Privacy-Engineering.git
ni download project


 Step 3: p kat project folder
cd Privacy-Engineering

 Step 4: Install dependencies
npm install
 tunggu sampai finish

 Step 5: Run server
node app.js

nanti akan keluaq:

Database created/connected!
Server running on http://localhost:3000

PENTING: jangan tutup, kalau dk server disconnected


 Step 6: Test 

 letak data (run in PowerShell):

JANGAN GUNA DATA BWH NI, BUAT BARU, NI CONTOH SAJA, SEBAB NNTI KALAU SEMUA GUNA YANG NI JADI REDUNDANT, AS OF NOW, X BOLEH DELETE LAGI DATA, ADA 4 ALI NNTI KANG


Invoke-RestMethod -Uri "http://localhost:3000/submit" `-Method Post`
-Body '{"name":"Ali","dob":"2000-01-01","address":"KL"}' `
-ContentType "application/json"



 Step 7: View data

bukak browser & copy LINK kat bawah ke search bar:

http://localhost:3000/users

-

