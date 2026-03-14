"""
Comprehensive Israel localities database - cities, towns, villages, settlements
with Hebrew names and GPS coordinates
"""

ISRAEL_LOCALITIES = [
    # Major Cities
    {"name": "ירושלים", "name_en": "Jerusalem", "lat": 31.7683, "lng": 35.2137, "region": "ירושלים"},
    {"name": "תל אביב-יפו", "name_en": "Tel Aviv-Yafo", "lat": 32.0853, "lng": 34.7818, "region": "תל אביב"},
    {"name": "חיפה", "name_en": "Haifa", "lat": 32.7940, "lng": 34.9896, "region": "חיפה"},
    {"name": "ראשון לציון", "name_en": "Rishon LeZion", "lat": 31.9730, "lng": 34.7925, "region": "מרכז"},
    {"name": "פתח תקווה", "name_en": "Petah Tikva", "lat": 32.0841, "lng": 34.8878, "region": "מרכז"},
    {"name": "אשדוד", "name_en": "Ashdod", "lat": 31.8044, "lng": 34.6553, "region": "דרום"},
    {"name": "נתניה", "name_en": "Netanya", "lat": 32.3215, "lng": 34.8532, "region": "שרון"},
    {"name": "באר שבע", "name_en": "Beer Sheva", "lat": 31.2520, "lng": 34.7915, "region": "דרום"},
    {"name": "חולון", "name_en": "Holon", "lat": 32.0158, "lng": 34.7875, "region": "תל אביב"},
    {"name": "בני ברק", "name_en": "Bnei Brak", "lat": 32.0834, "lng": 34.8331, "region": "תל אביב"},
    {"name": "רמת גן", "name_en": "Ramat Gan", "lat": 32.0682, "lng": 34.8249, "region": "תל אביב"},
    {"name": "אשקלון", "name_en": "Ashkelon", "lat": 31.6688, "lng": 34.5743, "region": "דרום"},
    {"name": "רחובות", "name_en": "Rehovot", "lat": 31.8928, "lng": 34.8113, "region": "מרכז"},
    {"name": "בת ים", "name_en": "Bat Yam", "lat": 32.0171, "lng": 34.7510, "region": "תל אביב"},
    {"name": "הרצליה", "name_en": "Herzliya", "lat": 32.1629, "lng": 34.7916, "region": "שרון"},
    {"name": "כפר סבא", "name_en": "Kfar Saba", "lat": 32.1780, "lng": 34.9068, "region": "שרון"},
    {"name": "חדרה", "name_en": "Hadera", "lat": 32.4340, "lng": 34.9196, "region": "חיפה"},
    {"name": "מודיעין-מכבים-רעות", "name_en": "Modiin", "lat": 31.8969, "lng": 35.0104, "region": "מרכז"},
    {"name": "נצרת", "name_en": "Nazareth", "lat": 32.6996, "lng": 35.3035, "region": "צפון"},
    {"name": "לוד", "name_en": "Lod", "lat": 31.9520, "lng": 34.8952, "region": "מרכז"},
    {"name": "רמלה", "name_en": "Ramla", "lat": 31.9275, "lng": 34.8697, "region": "מרכז"},
    {"name": "רעננה", "name_en": "Ra'anana", "lat": 32.1845, "lng": 34.8697, "region": "שרון"},
    {"name": "נהריה", "name_en": "Nahariya", "lat": 33.0060, "lng": 35.0980, "region": "צפון"},
    {"name": "גבעתיים", "name_en": "Givatayim", "lat": 32.0714, "lng": 34.8122, "region": "תל אביב"},
    {"name": "הוד השרון", "name_en": "Hod HaSharon", "lat": 32.1533, "lng": 34.8882, "region": "שרון"},
    {"name": "עכו", "name_en": "Acre", "lat": 32.9272, "lng": 35.0764, "region": "צפון"},
    {"name": "כרמיאל", "name_en": "Karmiel", "lat": 32.9190, "lng": 35.2963, "region": "צפון"},
    {"name": "אילת", "name_en": "Eilat", "lat": 29.5581, "lng": 34.9482, "region": "דרום"},
    {"name": "טבריה", "name_en": "Tiberias", "lat": 32.7960, "lng": 35.5300, "region": "צפון"},
    {"name": "עפולה", "name_en": "Afula", "lat": 32.6080, "lng": 35.2880, "region": "צפון"},
    {"name": "קריית שמונה", "name_en": "Kiryat Shmona", "lat": 33.2072, "lng": 35.5712, "region": "צפון"},
    {"name": "קריית גת", "name_en": "Kiryat Gat", "lat": 31.6100, "lng": 34.7642, "region": "דרום"},
    {"name": "קריית ביאליק", "name_en": "Kiryat Bialik", "lat": 32.8292, "lng": 35.0830, "region": "חיפה"},
    {"name": "קריית מוצקין", "name_en": "Kiryat Motzkin", "lat": 32.8375, "lng": 35.0770, "region": "חיפה"},
    {"name": "קריית אתא", "name_en": "Kiryat Ata", "lat": 32.8100, "lng": 35.1100, "region": "חיפה"},
    {"name": "קריית ים", "name_en": "Kiryat Yam", "lat": 32.8540, "lng": 35.0694, "region": "חיפה"},
    {"name": "אור יהודה", "name_en": "Or Yehuda", "lat": 32.0308, "lng": 34.8553, "region": "תל אביב"},
    {"name": "צפת", "name_en": "Safed", "lat": 32.9649, "lng": 35.4963, "region": "צפון"},
    {"name": "דימונה", "name_en": "Dimona", "lat": 31.0680, "lng": 35.0330, "region": "דרום"},
    {"name": "נס ציונה", "name_en": "Ness Ziona", "lat": 31.9330, "lng": 34.7985, "region": "מרכז"},
    {"name": "יבנה", "name_en": "Yavne", "lat": 31.8785, "lng": 34.7394, "region": "מרכז"},
    {"name": "אור עקיבא", "name_en": "Or Akiva", "lat": 32.5060, "lng": 34.9200, "region": "חיפה"},
    {"name": "טירת כרמל", "name_en": "Tirat Carmel", "lat": 32.7590, "lng": 34.9710, "region": "חיפה"},
    {"name": "עראבה", "name_en": "Arraba", "lat": 32.8520, "lng": 35.3390, "region": "צפון"},
    {"name": "סכנין", "name_en": "Sakhnin", "lat": 32.8640, "lng": 35.3000, "region": "צפון"},
    {"name": "טמרה", "name_en": "Tamra", "lat": 32.8560, "lng": 35.1980, "region": "צפון"},
    {"name": "שפרעם", "name_en": "Shefaram", "lat": 32.8060, "lng": 35.1710, "region": "צפון"},
    {"name": "אום אל-פחם", "name_en": "Umm al-Fahm", "lat": 32.5170, "lng": 35.1530, "region": "חיפה"},
    {"name": "טייבה", "name_en": "Tayibe", "lat": 32.2660, "lng": 35.0080, "region": "מרכז"},
    {"name": "קלנסואה", "name_en": "Qalansawe", "lat": 32.2830, "lng": 34.9830, "region": "מרכז"},
    {"name": "באקה אל-גרבייה", "name_en": "Baqa al-Gharbiyye", "lat": 32.4180, "lng": 35.0400, "region": "חיפה"},
    {"name": "נוף הגליל", "name_en": "Nof HaGalil", "lat": 32.7199, "lng": 35.3223, "region": "צפון"},
    {"name": "מגדל העמק", "name_en": "Migdal HaEmek", "lat": 32.6712, "lng": 35.2418, "region": "צפון"},
    {"name": "יקנעם עילית", "name_en": "Yokneam Illit", "lat": 32.6592, "lng": 35.1089, "region": "צפון"},
    {"name": "זכרון יעקב", "name_en": "Zikhron Yaakov", "lat": 32.5716, "lng": 34.9530, "region": "חיפה"},
    {"name": "פרדס חנה-כרכור", "name_en": "Pardes Hanna-Karkur", "lat": 32.4723, "lng": 34.9683, "region": "חיפה"},
    {"name": "בנימינה-גבעת עדה", "name_en": "Binyamina-Givat Ada", "lat": 32.5170, "lng": 34.9460, "region": "חיפה"},
    {"name": "קיסריה", "name_en": "Caesarea", "lat": 32.5000, "lng": 34.8900, "region": "חיפה"},
    {"name": "עתלית", "name_en": "Atlit", "lat": 32.6880, "lng": 34.9400, "region": "חיפה"},
    {"name": "נשר", "name_en": "Nesher", "lat": 32.7710, "lng": 35.0400, "region": "חיפה"},
    {"name": "יהוד-מונוסון", "name_en": "Yehud-Monosson", "lat": 32.0330, "lng": 34.8830, "region": "מרכז"},
    {"name": "גני תקווה", "name_en": "Ganei Tikva", "lat": 32.0605, "lng": 34.8770, "region": "מרכז"},
    {"name": "קריית אונו", "name_en": "Kiryat Ono", "lat": 32.0580, "lng": 34.8556, "region": "תל אביב"},
    {"name": "גבעת שמואל", "name_en": "Givat Shmuel", "lat": 32.0761, "lng": 34.8472, "region": "מרכז"},
    {"name": "אלעד", "name_en": "Elad", "lat": 32.0520, "lng": 34.9510, "region": "מרכז"},
    {"name": "ראש העין", "name_en": "Rosh HaAyin", "lat": 32.0953, "lng": 34.9563, "region": "מרכז"},
    {"name": "שוהם", "name_en": "Shoham", "lat": 31.9961, "lng": 34.9471, "region": "מרכז"},
    {"name": "גדרה", "name_en": "Gedera", "lat": 31.8140, "lng": 34.7790, "region": "מרכז"},
    {"name": "מזכרת בתיה", "name_en": "Mazkeret Batya", "lat": 31.8510, "lng": 34.7880, "region": "מרכז"},
    {"name": "קדימה-צורן", "name_en": "Kadima-Zoran", "lat": 32.2770, "lng": 34.9170, "region": "שרון"},
    {"name": "כפר יונה", "name_en": "Kfar Yona", "lat": 32.3170, "lng": 34.9340, "region": "שרון"},
    {"name": "אבן יהודה", "name_en": "Even Yehuda", "lat": 32.2700, "lng": 34.8870, "region": "שרון"},
    {"name": "זמורה", "name_en": "Ganot", "lat": 31.9250, "lng": 34.8100, "region": "מרכז"},
    {"name": "בית שמש", "name_en": "Beit Shemesh", "lat": 31.7510, "lng": 34.9887, "region": "ירושלים"},
    {"name": "מעלה אדומים", "name_en": "Ma'ale Adumim", "lat": 31.7760, "lng": 35.3040, "region": "ירושלים"},
    {"name": "ביתר עילית", "name_en": "Beitar Illit", "lat": 31.6930, "lng": 35.1230, "region": "ירושלים"},
    {"name": "גבעת זאב", "name_en": "Givat Ze'ev", "lat": 31.8620, "lng": 35.1740, "region": "ירושלים"},
    {"name": "מבשרת ציון", "name_en": "Mevaseret Zion", "lat": 31.8010, "lng": 35.1530, "region": "ירושלים"},
    {"name": "אריאל", "name_en": "Ariel", "lat": 32.1050, "lng": 35.1750, "region": "שומרון"},
    {"name": "ערד", "name_en": "Arad", "lat": 31.2550, "lng": 35.2130, "region": "דרום"},
    {"name": "מצפה רמון", "name_en": "Mitzpe Ramon", "lat": 30.6100, "lng": 34.8020, "region": "דרום"},
    {"name": "אופקים", "name_en": "Ofakim", "lat": 31.3120, "lng": 34.6190, "region": "דרום"},
    {"name": "נתיבות", "name_en": "Netivot", "lat": 31.4210, "lng": 34.5880, "region": "דרום"},
    {"name": "שדרות", "name_en": "Sderot", "lat": 31.5250, "lng": 34.5960, "region": "דרום"},
    {"name": "ירוחם", "name_en": "Yeruham", "lat": 30.9890, "lng": 34.9300, "region": "דרום"},
    {"name": "קריית מלאכי", "name_en": "Kiryat Malakhi", "lat": 31.7300, "lng": 34.7480, "region": "דרום"},
    # Towns & Settlements
    {"name": "רמת השרון", "name_en": "Ramat HaSharon", "lat": 32.1460, "lng": 34.8380, "region": "שרון"},
    {"name": "כפר שמריהו", "name_en": "Kfar Shmaryahu", "lat": 32.1780, "lng": 34.8230, "region": "שרון"},
    {"name": "סביון", "name_en": "Savyon", "lat": 32.0470, "lng": 34.8770, "region": "מרכז"},
    {"name": "עומר", "name_en": "Omer", "lat": 31.2650, "lng": 34.8490, "region": "דרום"},
    {"name": "להבים", "name_en": "Lehavim", "lat": 31.3740, "lng": 34.8150, "region": "דרום"},
    {"name": "מיתר", "name_en": "Meitar", "lat": 31.3260, "lng": 34.9340, "region": "דרום"},
    {"name": "כוכב יאיר", "name_en": "Kokhav Yair", "lat": 32.2220, "lng": 34.9850, "region": "שרון"},
    {"name": "צור יגאל", "name_en": "Tzur Yigal", "lat": 32.2370, "lng": 34.9500, "region": "שרון"},
    {"name": "אלפי מנשה", "name_en": "Alfei Menashe", "lat": 32.1760, "lng": 35.0340, "region": "שומרון"},
    {"name": "כפר קאסם", "name_en": "Kafr Qasim", "lat": 32.1140, "lng": 34.9780, "region": "מרכז"},
    {"name": "ג'לג'וליה", "name_en": "Jaljulia", "lat": 32.1550, "lng": 34.9560, "region": "מרכז"},
    {"name": "טירה", "name_en": "Tira", "lat": 32.2340, "lng": 34.9510, "region": "מרכז"},
    {"name": "מעלות-תרשיחא", "name_en": "Ma'alot-Tarshiha", "lat": 33.0166, "lng": 35.2724, "region": "צפון"},
    {"name": "שלומי", "name_en": "Shlomi", "lat": 33.0750, "lng": 35.1430, "region": "צפון"},
    {"name": "מטולה", "name_en": "Metula", "lat": 33.2790, "lng": 35.5830, "region": "צפון"},
    {"name": "ראש פינה", "name_en": "Rosh Pinna", "lat": 32.9690, "lng": 35.5420, "region": "צפון"},
    {"name": "חצור הגלילית", "name_en": "Hazor HaGlilit", "lat": 32.9810, "lng": 35.5460, "region": "צפון"},
    {"name": "בית שאן", "name_en": "Beit She'an", "lat": 32.5010, "lng": 35.4970, "region": "צפון"},
    {"name": "קצרין", "name_en": "Katzrin", "lat": 32.9920, "lng": 35.6910, "region": "גולן"},
    {"name": "גבעת אלה", "name_en": "Givat Ella", "lat": 32.6800, "lng": 35.1500, "region": "צפון"},
    {"name": "דליית אל-כרמל", "name_en": "Daliyat al-Karmel", "lat": 32.6910, "lng": 35.0540, "region": "חיפה"},
    {"name": "עוספייה", "name_en": "Isfiya", "lat": 32.7280, "lng": 35.0630, "region": "חיפה"},
    {"name": "פוריידיס", "name_en": "Fureidis", "lat": 32.6140, "lng": 34.9500, "region": "חיפה"},
    {"name": "ג'סר א-זרקא", "name_en": "Jisr az-Zarqa", "lat": 32.5360, "lng": 34.9040, "region": "חיפה"},
    {"name": "מעיליא", "name_en": "Mi'ilya", "lat": 32.9920, "lng": 35.2360, "region": "צפון"},
    {"name": "פקיעין", "name_en": "Peki'in", "lat": 32.9700, "lng": 35.3300, "region": "צפון"},
    {"name": "יפיע", "name_en": "Yafi", "lat": 32.6790, "lng": 35.2710, "region": "צפון"},
    {"name": "כפר כנא", "name_en": "Kafr Kanna", "lat": 32.7500, "lng": 35.3400, "region": "צפון"},
    {"name": "ריינה", "name_en": "Reineh", "lat": 32.7270, "lng": 35.3130, "region": "צפון"},
    {"name": "דבורייה", "name_en": "Daburiyya", "lat": 32.6850, "lng": 35.3760, "region": "צפון"},
    {"name": "כפר מנדא", "name_en": "Kafr Manda", "lat": 32.8150, "lng": 35.2700, "region": "צפון"},
    {"name": "רהט", "name_en": "Rahat", "lat": 31.3940, "lng": 34.7540, "region": "דרום"},
    {"name": "תל שבע", "name_en": "Tel Sheva", "lat": 31.2510, "lng": 34.8080, "region": "דרום"},
    {"name": "ערערה בנגב", "name_en": "Ar'ara BaNegev", "lat": 31.2830, "lng": 34.8880, "region": "דרום"},
    {"name": "כסיפה", "name_en": "Kuseife", "lat": 31.2340, "lng": 34.9740, "region": "דרום"},
    {"name": "חורה", "name_en": "Hura", "lat": 31.2970, "lng": 34.9160, "region": "דרום"},
    {"name": "לקייה", "name_en": "Lakiya", "lat": 31.3660, "lng": 34.8210, "region": "דרום"},
    {"name": "שגב-שלום", "name_en": "Segev-Shalom", "lat": 31.2500, "lng": 34.8600, "region": "דרום"},
    # Kibbutzim & Moshavim
    {"name": "קיבוץ עין גדי", "name_en": "Ein Gedi", "lat": 31.4660, "lng": 35.3810, "region": "דרום"},
    {"name": "קיבוץ דגניה", "name_en": "Degania", "lat": 32.7110, "lng": 35.5770, "region": "צפון"},
    {"name": "קיבוץ גבעת ברנר", "name_en": "Givat Brenner", "lat": 31.8620, "lng": 34.7990, "region": "מרכז"},
    {"name": "קיבוץ נחשולים", "name_en": "Nahsholim", "lat": 32.6170, "lng": 34.8930, "region": "חיפה"},
    {"name": "מושב בן שמן", "name_en": "Ben Shemen", "lat": 31.9480, "lng": 34.9400, "region": "מרכז"},
    {"name": "גן יבנה", "name_en": "Gan Yavne", "lat": 31.7870, "lng": 34.7050, "region": "מרכז"},
    {"name": "גבעת עדה", "name_en": "Givat Ada", "lat": 32.4950, "lng": 34.9500, "region": "חיפה"},
    {"name": "עין הוד", "name_en": "Ein Hod", "lat": 32.6970, "lng": 34.9870, "region": "חיפה"},
    # Development Towns
    {"name": "יוקנעם", "name_en": "Yokneam", "lat": 32.6592, "lng": 35.1089, "region": "צפון"},
    {"name": "אור עקיבא", "name_en": "Or Akiva", "lat": 32.5060, "lng": 34.9200, "region": "חיפה"},
    {"name": "גבעת אולגה", "name_en": "Givat Olga", "lat": 32.4490, "lng": 34.8760, "region": "חיפה"},
    # Religious Cities
    {"name": "בית אל", "name_en": "Beit El", "lat": 31.9420, "lng": 35.2230, "region": "שומרון"},
    {"name": "עמנואל", "name_en": "Emanuel", "lat": 32.1580, "lng": 35.1510, "region": "שומרון"},
    {"name": "קדומים", "name_en": "Kedumim", "lat": 32.1660, "lng": 35.1600, "region": "שומרון"},
    {"name": "קרני שומרון", "name_en": "Karnei Shomron", "lat": 32.1710, "lng": 35.0970, "region": "שומרון"},
    # Gush Dan Area
    {"name": "אזור", "name_en": "Azor", "lat": 32.0240, "lng": 34.7930, "region": "תל אביב"},
    {"name": "תל אביב", "name_en": "Tel Aviv", "lat": 32.0853, "lng": 34.7818, "region": "תל אביב"},
    {"name": "יפו", "name_en": "Jaffa", "lat": 32.0500, "lng": 34.7560, "region": "תל אביב"},
    {"name": "רמת אביב", "name_en": "Ramat Aviv", "lat": 32.1130, "lng": 34.7970, "region": "תל אביב"},
    {"name": "נווה צדק", "name_en": "Neve Tzedek", "lat": 32.0620, "lng": 34.7660, "region": "תל אביב"},
    # Sharon Area
    {"name": "תל מונד", "name_en": "Tel Mond", "lat": 32.2550, "lng": 34.9200, "region": "שרון"},
    {"name": "נורדיה", "name_en": "Nordiya", "lat": 32.2010, "lng": 34.8620, "region": "שרון"},
    {"name": "שרונה", "name_en": "Sharona", "lat": 32.1970, "lng": 34.8990, "region": "שרון"},
    {"name": "גבעת חיים", "name_en": "Givat Haim", "lat": 32.3980, "lng": 34.8990, "region": "שרון"},
    {"name": "בית יצחק", "name_en": "Beit Yitzhak", "lat": 32.2840, "lng": 34.8730, "region": "שרון"},
    # Galilee Villages
    {"name": "כפר תבור", "name_en": "Kfar Tavor", "lat": 32.6930, "lng": 35.4200, "region": "צפון"},
    {"name": "שבלי", "name_en": "Shibli", "lat": 32.6970, "lng": 35.3740, "region": "צפון"},
    {"name": "עילוט", "name_en": "Ilut", "lat": 32.7250, "lng": 35.2420, "region": "צפון"},
    {"name": "כאבול", "name_en": "Kabul", "lat": 32.8700, "lng": 35.2170, "region": "צפון"},
    {"name": "מג'ד אל-כרום", "name_en": "Majd al-Krum", "lat": 32.9200, "lng": 35.2450, "region": "צפון"},
    {"name": "דיר אל-אסד", "name_en": "Deir al-Asad", "lat": 32.9320, "lng": 35.2680, "region": "צפון"},
    {"name": "כפר יאסיף", "name_en": "Kafr Yasif", "lat": 32.9530, "lng": 35.1600, "region": "צפון"},
    {"name": "ג'דיידה-מכר", "name_en": "Judeida-Makr", "lat": 32.9260, "lng": 35.1530, "region": "צפון"},
    {"name": "אבו סנאן", "name_en": "Abu Sinan", "lat": 32.9530, "lng": 35.1760, "region": "צפון"},
    {"name": "ירכא", "name_en": "Yarka", "lat": 32.9570, "lng": 35.2020, "region": "צפון"},
    {"name": "חורפיש", "name_en": "Hurfeish", "lat": 33.0220, "lng": 35.3440, "region": "צפון"},
    {"name": "בית ג'ן", "name_en": "Beit Jann", "lat": 32.9570, "lng": 35.3770, "region": "צפון"},
    # Negev & South
    {"name": "מעגלים", "name_en": "Ma'agalim", "lat": 31.4120, "lng": 34.5070, "region": "דרום"},
    {"name": "תקומה", "name_en": "Tkuma", "lat": 31.4080, "lng": 34.5470, "region": "דרום"},
    {"name": "גבולות", "name_en": "Gevulot", "lat": 31.2260, "lng": 34.4160, "region": "דרום"},
    # Judean Hills
    {"name": "אפרת", "name_en": "Efrat", "lat": 31.6530, "lng": 35.1610, "region": "ירושלים"},
    {"name": "קריית ארבע", "name_en": "Kiryat Arba", "lat": 31.5290, "lng": 35.1190, "region": "ירושלים"},
    {"name": "טקוע", "name_en": "Tekoa", "lat": 31.6350, "lng": 35.2260, "region": "ירושלים"},
    # Coastal Cities
    {"name": "עין כרם", "name_en": "Ein Kerem", "lat": 31.7640, "lng": 35.1610, "region": "ירושלים"},
    {"name": "מוצא עילית", "name_en": "Motza Illit", "lat": 31.7870, "lng": 35.1530, "region": "ירושלים"},
    # Golan Heights
    {"name": "חד נס", "name_en": "Had Nes", "lat": 32.7540, "lng": 35.6590, "region": "גולן"},
    {"name": "אל-רום", "name_en": "El Rom", "lat": 33.1960, "lng": 35.7920, "region": "גולן"},
    {"name": "מג'דל שמס", "name_en": "Majdal Shams", "lat": 33.2690, "lng": 35.7660, "region": "גולן"},
    {"name": "מסעדה", "name_en": "Mas'ade", "lat": 33.2310, "lng": 35.7630, "region": "גולן"},
    {"name": "בוקעאתא", "name_en": "Buq'ata", "lat": 33.2020, "lng": 35.7680, "region": "גולן"},
    # More Southern
    {"name": "קריית אקרון", "name_en": "Kiryat Ekron", "lat": 31.8610, "lng": 34.7930, "region": "מרכז"},
    {"name": "בית דגן", "name_en": "Beit Dagan", "lat": 31.9930, "lng": 34.8330, "region": "מרכז"},
    {"name": "בארותיים", "name_en": "Be'erotayim", "lat": 32.1860, "lng": 34.8480, "region": "שרון"},
    # Jordan Valley
    {"name": "בקעת הירדן", "name_en": "Jordan Valley", "lat": 32.2650, "lng": 35.5370, "region": "צפון"},
    {"name": "מחולה", "name_en": "Mehola", "lat": 32.3350, "lng": 35.5060, "region": "צפון"},
    # Additional Missing Cities
    {"name": "יהוד", "name_en": "Yehud", "lat": 32.0330, "lng": 34.8830, "region": "מרכז"},
    {"name": "כפר חב\"ד", "name_en": "Kfar Chabad", "lat": 31.9850, "lng": 34.8460, "region": "מרכז"},
    {"name": "נס הרים", "name_en": "Nes Harim", "lat": 31.7330, "lng": 35.0730, "region": "ירושלים"},
    {"name": "צור הדסה", "name_en": "Tzur Hadassah", "lat": 31.7160, "lng": 35.1020, "region": "ירושלים"},
    {"name": "בית נחמיה", "name_en": "Beit Nechemya", "lat": 31.8590, "lng": 34.9510, "region": "מרכז"},
    {"name": "חריש", "name_en": "Harish", "lat": 32.4570, "lng": 35.0440, "region": "מרכז"},
    {"name": "עין שמר", "name_en": "Ein Shemer", "lat": 32.4370, "lng": 35.0090, "region": "חיפה"},
    {"name": "עמק חפר", "name_en": "Emek Hefer", "lat": 32.3690, "lng": 34.9100, "region": "שרון"},
    {"name": "גנים", "name_en": "Ganim", "lat": 32.2410, "lng": 34.9770, "region": "שרון"},
]

# Region coordinates for fallback
REGION_CENTERS = {
    "תל אביב": {"lat": 32.08, "lng": 34.78, "radius_km": 20},
    "מרכז": {"lat": 32.07, "lng": 34.82, "radius_km": 40},
    "חיפה": {"lat": 32.8, "lng": 35.0, "radius_km": 30},
    "צפון": {"lat": 32.9, "lng": 35.3, "radius_km": 60},
    "השרון": {"lat": 32.3, "lng": 34.9, "radius_km": 30},
    "ירושלים": {"lat": 31.77, "lng": 35.21, "radius_km": 40},
    "דרום": {"lat": 31.25, "lng": 34.79, "radius_km": 80},
    "יהודה ושומרון": {"lat": 32.1, "lng": 35.15, "radius_km": 50},
    "גולן": {"lat": 33.0, "lng": 35.75, "radius_km": 30},
    # Legacy names (for backward compatibility)
    "חיפה והקריות": {"lat": 32.8, "lng": 35.0, "radius_km": 30},
    "ירושלים והסביבה": {"lat": 31.77, "lng": 35.21, "radius_km": 40},
    "שרון": {"lat": 32.3, "lng": 34.9, "radius_km": 30},
    "שומרון": {"lat": 32.15, "lng": 35.15, "radius_km": 50},
}

# Region name mappings - which locality regions belong to each search region
REGION_LOCALITY_MAPPING = {
    "תל אביב": ["תל אביב"],
    "מרכז": ["מרכז"],
    "חיפה": ["חיפה"],
    "צפון": ["צפון"],
    "השרון": ["שרון", "השרון"],
    "ירושלים": ["ירושלים"],
    "דרום": ["דרום"],
    "יהודה ושומרון": ["שומרון", "יהודה ושומרון"],
    "גולן": ["גולן"],
    # Legacy names
    "חיפה והקריות": ["חיפה"],
    "ירושלים והסביבה": ["ירושלים"],
}

def get_region_info(region_name: str):
    """Get region center coordinates and radius. Returns None if not a region."""
    return REGION_CENTERS.get(region_name)

def get_cities_in_region(region_name: str):
    """Get all city names that belong to a region"""
    locality_regions = REGION_LOCALITY_MAPPING.get(region_name)
    if not locality_regions:
        return []
    cities = []
    for loc in ISRAEL_LOCALITIES:
        if loc.get("region") in locality_regions:
            cities.append(loc["name"])
    return cities

def get_locality_coords(name: str):
    """Get coordinates for a locality name"""
    name_lower = name.strip()
    for loc in ISRAEL_LOCALITIES:
        if loc["name"] == name_lower or loc.get("name_en", "").lower() == name_lower.lower():
            return {"lat": loc["lat"], "lng": loc["lng"], "region": loc.get("region", "")}
    # Partial match
    for loc in ISRAEL_LOCALITIES:
        if name_lower in loc["name"] or loc["name"] in name_lower:
            return {"lat": loc["lat"], "lng": loc["lng"], "region": loc.get("region", "")}
    return None

def search_localities(query: str, limit: int = 20):
    """Search localities by name"""
    results = []
    q = query.strip().lower()
    for loc in ISRAEL_LOCALITIES:
        if q in loc["name"] or q in loc.get("name_en", "").lower():
            results.append(loc)
    return results[:limit]
