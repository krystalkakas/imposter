import { Type } from "@google/genai";

export interface KeywordTopic {
  topic: string;
  keywords: string[];
}

export const KEYWORD_DATA: KeywordTopic[] = [
  {
    topic: "Đồ ăn Việt Nam",
    keywords: ["Phở", "Bún chả", "Bánh mì", "Cơm tấm", "Bún riêu", "Bánh xèo", "Gỏi cuốn", "Cháo lòng", "Bún bò Huế", "Bánh cuốn", "Hủ tiếu", "Bánh đa cua", "Bún đậu mắm tôm", "Xôi xéo", "Bánh canh", "Bún mắm", "Bánh chưng", "Nem rán", "Cá kho tộ", "Canh chua"]
  },
  {
    topic: "Mạng xã hội & Xu hướng",
    keywords: ["TikTok", "Facebook", "Instagram", "Threads", "YouTube", "Livestream", "Viral", "Influencer", "Meme", "Hashtag", "Follower", "Content Creator", "Podcast", "Shorts", "Reels", "Story", "Comment", "Share", "Like", "Trending"]
  },
  {
    topic: "Du lịch Việt Nam",
    keywords: ["Hạ Long", "Đà Lạt", "Phú Quốc", "Hội An", "Sapa", "Nha Trang", "Huế", "Phong Nha", "Mũi Né", "Đảo Lý Sơn", "Côn Đảo", "Tràng An", "Tam Cốc", "Fansipan", "Bà Nà Hills", "Chợ nổi Cái Răng", "Địa đạo Củ Chi", "Mù Cang Chải", "Hà Giang", "Vũng Tàu"]
  },
  {
    topic: "Slang Gen Z",
    keywords: ["Flex", "Chill", "Ghost", "Red flag", "Green flag", "Slay", "Cringe", "Simp", "Toxic", "Drama", "Vibe", "Over hợp", "Chằm Zn", "Gét gô", "Ét ô ét", "U là trời", "Xu cà na", "Phát cơm chó", "Cắm sừng", "Trà xanh"]
  },
  {
    topic: "Phim & Nhạc Hot",
    keywords: ["Rap Việt", "Anh Trai Say Hi", "Anh Trai Vượt Ngàn Chông Gai", "Lật Mặt", "Mai", "Em và Trịnh", "Bố Già", "Mắt Biếc", "Người Vợ Cuối Cùng", "Đất Rừng Phương Nam", "Vợ Ba", "Song Lang", "Chị Chị Em Em", "Tiệc Trăng Máu", "Gái Già Lắm Chiêu", "Em Chưa 18", "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", "Tháng Năm Rực Rỡ", "Cô Ba Sài Gòn", "Hai Phượng"]
  },
  {
    topic: "Thể thao",
    keywords: ["Bóng đá", "Cầu lông", "Bóng rổ", "Bóng chuyền", "Tennis", "Bơi lội", "Chạy bộ", "Gym", "Yoga", "Đạp xe", "Võ thuật", "Bắn súng", "Đấu kiếm", "Golf", "Bóng bàn", "Leo núi", "Trượt ván", "Bóng bầu dục", "Bóng chày", "Đua xe"]
  },
  {
    topic: "Công nghệ thường ngày",
    keywords: ["Smartphone", "Laptop", "Tai nghe Bluetooth", "Sạc dự phòng", "Smartwatch", "Máy tính bảng", "Wifi", "ChatGPT", "AI", "Robot hút bụi", "Camera an ninh", "Tivi thông minh", "Loa thông minh", "Chuột không dây", "Bàn phím cơ", "Máy ảnh", "Flycam", "Kính VR", "Ổ cứng di động", "Máy in"]
  },
  {
    topic: "Trường học & Sinh viên",
    keywords: ["Ký túc xá", "Thư viện", "Học bổng", "Đồ án", "Tiểu luận", "Thi học kỳ", "Câu lạc bộ", "Thực tập", "Tốt nghiệp", "Giảng đường", "Căng tin", "Bảo vệ", "Gửi xe", "Học phí", "Đăng ký tín chỉ", "Phòng trọ", "Xe buýt", "Làm thêm", "Tình nguyện", "Mùa hè xanh"]
  },
  {
    topic: "Thời trang đường phố",
    keywords: ["Sneaker", "Hoodie", "T-shirt", "Jeans", "Túi đeo chéo", "Mũ lưỡi trai", "Áo khoác bomber", "Quần jogger", "Kính râm", "Vòng tay", "Tất cao cổ", "Áo oversize", "Local Brand", "Streetwear", "Vintage", "Y2K", "Minimalism", "Denim", "Flannel", "Cargo pants"]
  },
  {
    topic: "Động vật cute đang trend",
    keywords: ["Mèo Anh lông ngắn", "Chó Corgi", "Gấu trúc", "Chuột Capybara", "Thỏ", "Sóc", "Chim cánh cụt", "Hải cẩu", "Cáo", "Gấu Bắc Cực", "Chó Husky", "Mèo Munchkin", "Chuột Hamster", "Vịt vàng", "Gấu Koala", "Lười", "Rái cá", "Voi con", "Hươu cao cổ", "Ngựa vằn"]
  },
  {
    topic: "Cảm xúc & Tâm trạng",
    keywords: ["Hạnh phúc", "Buồn bã", "Giận dữ", "Lo lắng", "Hào hứng", "Mệt mỏi", "Cô đơn", "Bối rối", "Ngạc nhiên", "Tự tin", "Sợ hãi", "Thất vọng", "Biết ơn", "Hy vọng", "Yêu đời", "Áp lực", "Thư giãn", "Nhớ nhung", "Ghen tị", "Hối hận"]
  },
  {
    topic: "Nghề nghiệp hiện đại",
    keywords: ["Streamer", "YouTuber", "TikToker", "Lập trình viên", "Designer", "Copywriter", "Digital Marketer", "Data Analyst", "UI/UX Designer", "Video Editor", "Freelancer", "E-commerce Specialist", "SEO Expert", "Social Media Manager", "AI Engineer", "Blockchain Developer", "Cyber Security", "Game Developer", "Podcaster", "Vlogger"]
  },
  {
    topic: "Ẩm thực quốc tế phổ biến ở VN",
    keywords: ["Sushi", "Pizza", "Hamburger", "Mì Ý", "Tokbokki", "Kimbap", "Gà rán", "Lẩu Thái", "Dimsum", "Mì Ramen", "Steak", "Tacos", "Doner Kebab", "Sashimi", "Mì Udon", "Cơm trộn Bibimbap", "Bánh Tart trứng", "Mì cay", "Lẩu Manwah", "Haidilao"]
  },
  {
    topic: "Thiên nhiên & Thời tiết",
    keywords: ["Cầu vồng", "Sấm sét", "Bão", "Sương mù", "Nắng gắt", "Mưa phùn", "Tuyết rơi", "Bình minh", "Hoàng hôn", "Rừng rậm", "Thác nước", "Hang động", "Sa mạc", "Đại dương", "Núi lửa", "Động đất", "Thủy triều", "Gió lốc", "Mây mù", "Trăng rằm"]
  },
  {
    topic: "Cuộc sống chung cư / thành thị",
    keywords: ["Thang máy", "Hầm gửi xe", "Thẻ cư dân", "Ban công", "Bể bơi", "Phòng Gym", "Siêu thị tiện lợi", "Bảo vệ 24/7", "Tiếng ồn", "Tắc đường", "Khói bụi", "Đèn đường", "Công viên", "Phố đi bộ", "Trung tâm thương mại", "Rạp chiếu phim", "Quán cà phê", "Vỉa hè", "Biển quảng cáo", "Grab"]
  }
];
