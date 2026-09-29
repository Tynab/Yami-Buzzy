import qrcode

link = "https://www.yamiannephilim.com/wedding-card"

qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=10,
    border=4,
)

qr.add_data(link)
qr.make(fit=True)

img = qr.make_image(fill_color="black", back_color="white")

img.save("qr_code.png")

print("QR Code đã được tạo và lưu thành công!")
