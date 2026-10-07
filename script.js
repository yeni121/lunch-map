// 1. Supabase(공용 게시판) 연결하기
const SUPABASE_URL = "https://febmbzezpreyhibumobd.supabase.co";
const SUPABASE_KEY = "sb_publishable_1pHYkRanaYtxXH5LhjDTag_x1WTs7TF";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. 지도 그리기
const mapArea = document.querySelector(".map-area");
const center = new kakao.maps.LatLng(37.4939203282553, 127.123900079395);
const map = new kakao.maps.Map(mapArea, {
  center: center,
  level: 3
});
// 🆕 지도 오른쪽 아래에 확대(+) · 축소(-) 버튼 달기
map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.BOTTOMRIGHT);

// 3. 회사 핀 꽂기 (맛집 핀과 다르게!)
const companySvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">' +
  '<path d="M18 0C8.1 0 0 8.1 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.1 27.9 0 18 0z" fill="#363636"/>' +
  '<rect x="11" y="9" width="14" height="17" rx="1.5" fill="white"/>' +
  '<rect x="14" y="12" width="3" height="3" fill="#363636"/>' +
  '<rect x="19" y="12" width="3" height="3" fill="#363636"/>' +
  '<rect x="14" y="17" width="3" height="3" fill="#363636"/>' +
  '<rect x="19" y="17" width="3" height="3" fill="#363636"/>' +
  '<rect x="16.5" y="22" width="3" height="4" fill="#ea5079"/>' +
  '</svg>';

const companyImage = new kakao.maps.MarkerImage(
  "data:image/svg+xml;charset=utf-8," + encodeURIComponent(companySvg),
  new kakao.maps.Size(36, 46),
  { offset: new kakao.maps.Point(18, 46) }
);

const companyMarker = new kakao.maps.Marker({
  position: center,
  map: map,
  image: companyImage,
  zIndex: 10
});

// 회사 이름표 (핀 위에 STAT&CO)
const companyLabel = document.createElement("div");
companyLabel.className = "company-label";
companyLabel.textContent = "STAT&CO";

new kakao.maps.CustomOverlay({
  position: center,
  content: companyLabel,
  yAnchor: 1,
  zIndex: 11,
  map: map
});

// 4. 화면의 칸들 찾기
const listArea = document.querySelector(".list-area");
const detailArea = document.querySelector(".detail-area");
const detailName = document.querySelector(".detail-name");
const detailInfo = document.querySelector(".detail-info");
const detailRating = document.querySelector(".detail-rating");
const backButton = document.querySelector(".back-button");
const userNameInput = document.querySelector("#user-name");
const starButtons = document.querySelectorAll(".detail-area .rating-form .star");
const addStarButtons = document.querySelectorAll(".add-form .star");
const submitRatingButton = document.querySelector(".submit-rating");
const addArea = document.querySelector(".add-area");
const addBackButton = document.querySelector(".add-back-button");
const searchInput = document.querySelector("#search-input");
const searchButton = document.querySelector(".search-button");
const searchResults = document.querySelector(".search-results");
const addForm = document.querySelector(".add-form");
const selectedPlaceText = document.querySelector(".selected-place");
const addCategorySelect = document.querySelector("#add-category");
const addUserNameInput = document.querySelector("#add-user-name");
const submitAddButton = document.querySelector(".submit-add");
const deleteButton = document.querySelector(".delete-button");
const editButton = document.querySelector(".edit-button");
const editForm = document.querySelector(".edit-form");
const editCategorySelect = document.querySelector("#edit-category");
const saveEditButton = document.querySelector(".save-edit");
const cancelEditButton = document.querySelector(".cancel-edit");
const reviewCommentInput = document.querySelector("#review-comment");
const reviewList = document.querySelector(".review-list");
const kakaoLink = document.querySelector(".kakao-link");
const blogLink = document.querySelector(".blog-link");
const menuAddToggle = document.querySelector(".menu-add-toggle");
const menuAddForm = document.querySelector(".menu-add-form");
const menuNameInput = document.querySelector("#menu-name");
const menuPriceInput = document.querySelector("#menu-price");
const saveMenuButton = document.querySelector(".save-menu");
const cancelMenuButton = document.querySelector(".cancel-menu");
const menuList = document.querySelector(".menu-list");
const menuReviewForm = document.querySelector(".menu-review-form");
const menuStarButtons = document.querySelectorAll(".menu-review-form .star");
const menuReviewComment = document.querySelector("#menu-review-comment");
const saveMenuReviewButton = document.querySelector(".save-menu-review");
const cancelMenuReviewButton = document.querySelector(".cancel-menu-review");

// 5. 기억해 둘 것들
let selectedRestaurant = null; // 지금 보고 있는 가게
let selectedScore = 0;         // 지금 고른 별 개수
let markers = [];              // 지도에 꽂은 맛집 핀들
let restaurants = [];          // 게시판에서 불러온 맛집 목록
let selectedPlace = null;      // 검색 결과에서 고른 가게
let foundPlaces = [];          // 검색으로 찾은 가게들
let shownCount = 0;            // 그중 화면에 보여준 개수
let searchMarker = null;       // 검색 결과에서 고른 가게의 임시 핀
let cameFromSearch = false;    // 검색 결과에서 자세히 보기로 왔는지
let addScore = 0;              // 맛집 추가할 때 고른 별 개수
let selectedCategory = "전체"; // 목록에서 고른 음식 종류
let cards = [];                // 목록에 그린 맛집 카드들
const LIST_PAGE_SIZE = 7;      // 목록에 한 번에 보여줄 개수
let listPage = 1;               // 지금 보고 있는 목록 페이지
let selectedMenu = null;        // 리뷰 쓰는 중인 메뉴
let menuScore = 0;              // 메뉴 리뷰에서 고른 별 개수

// 우리 사이트의 음식 종류 7가지 (기획서 규칙)
const CATEGORIES = ["한식", "중식", "일식", "양식", "분식", "카페·디저트", "기타"];

// 6. 평균 별점 계산하기 (별점이 없으면 -1)
function averageScore(ratings) {
  if (ratings.length === 0) {
    return -1;
  }

  let sum = 0;
  ratings.forEach(function (rating) {
    sum = sum + rating.score;
  });

  return sum / ratings.length;
}

// 6-1. 별점 글자 만들기
function ratingText(ratings) {
  if (ratings.length === 0) {
    return "아직 평가 없음";
  }
  return "★ " + averageScore(ratings).toFixed(1) + " (" + ratings.length + "명)";
}
// 7. 별 색칠하기
function paintStars(buttons = starButtons, chosenScore = selectedScore) {
  buttons.forEach(function (star) {
    const score = Number(star.dataset.score);
    if (score <= chosenScore) {
      star.classList.add("on");
    } else {
      star.classList.remove("on");
    }
  });
}

// 8. 자세히 보기 열기
function showDetail(restaurant, fromSearch) {
  cameFromSearch = fromSearch === true;
  if (cameFromSearch) {
    backButton.textContent = "← 검색 결과로";
  } else {
    backButton.textContent = "← 목록으로";
  }

  selectedRestaurant = restaurant;
  // 내가 이미 남긴 별점이 있으면 미리 채워 두기
  const myName = userNameInput.value.trim();
  const myRating = restaurant.ratings.find(function (rating) {
    return rating.user_name === myName;
  });

  if (myRating) {
    selectedScore = myRating.score;
    reviewCommentInput.value = myRating.comment || "";
    submitRatingButton.textContent = "별점 고치기";
  } else {
    selectedScore = 0;
    reviewCommentInput.value = "";
    submitRatingButton.textContent = "별점 남기기";
  }
  paintStars();

  detailName.textContent = restaurant.name;
  detailInfo.textContent = restaurant.category;
  detailRating.textContent = ratingText(restaurant.ratings);
  renderReviews(restaurant);

  // 🆕 더 알아보기: 카카오맵(영업시간 · 메뉴) · 블로그 리뷰 링크
  if (restaurant.kakao_url) {
    kakaoLink.href = restaurant.kakao_url.replace("http://", "https://");
  } else {
    kakaoLink.href = "https://map.kakao.com/link/search/" + encodeURIComponent(restaurant.name);
  }
  blogLink.href = "https://search.naver.com/search.naver?where=blog&query=" + encodeURIComponent(restaurant.name + " 송파");
  renderMenus(restaurant);
  menuAddForm.hidden = true;

  listArea.hidden = true;
  addArea.hidden = true;
  detailArea.hidden = false;
  editForm.hidden = true;

  map.panTo(new kakao.maps.LatLng(restaurant.lat, restaurant.lng));
  // 📱 휴대폰에서는 자세히 보기가 지도 아래에 있으니까, 그쪽으로 스르륵 내려가기
  if (window.innerWidth <= 768) {
    detailArea.scrollIntoView({ behavior: "smooth" });
  }
}

// 9. 목록으로 돌아가기
backButton.addEventListener("click", function () {
  detailArea.hidden = true;
  if (cameFromSearch) {
    addArea.hidden = false;
  } else {
    listArea.hidden = false;
  }
});

// 10. 별 누르기
starButtons.forEach(function (star) {
  star.addEventListener("click", function () {
    selectedScore = Number(star.dataset.score);
    paintStars();
  });
});

// 11. 별점 남기기 버튼
submitRatingButton.addEventListener("click", async function () {
  const userName = userNameInput.value.trim();

  if (userName === "") {
    alert("이름(닉네임)을 적어 주세요!");
    return;
  }
  if (selectedScore === 0) {
    alert("별을 1개 이상 눌러 주세요!");
    return;
  }

  const { error } = await db.from("ratings").upsert(
    {
      restaurant_id: selectedRestaurant.id,
      user_name: userName,
      score: selectedScore,
      comment: reviewCommentInput.value.trim() || null
    },
    { onConflict: "restaurant_id,user_name" }
  );

  if (error) {
    alert("별점을 저장하지 못했어요. 다시 시도해 주세요.");
    console.log("별점 저장 실패:", error);
    return;
  }
  rememberName(userName);
  alert("별점을 남겼어요! ⭐");

  const data = await loadRestaurants();
  const updated = data.find(function (restaurant) {
    return restaurant.id === selectedRestaurant.id;
  });
  showDetail(updated, cameFromSearch);
});

// 12. 게시판에서 맛집 불러와서 보여주기
async function loadRestaurants() {
  const { data, error } = await db.from("restaurants").select(
    "*, ratings(score, user_name, comment, created_at), menus(id, name, price, created_by, menu_reviews(score, user_name, comment, created_at))"
  );  if (error) {
    console.log("맛집을 불러오지 못했어요:", error);
    return [];
  }

  // 옛날 목록과 핀 지우기 (새로 그리기 전에!)
  listArea.innerHTML = "";
  markers.forEach(function (marker) {
    marker.setMap(null);
  });
  markers = [];
  cards = [];

  // 별점 높은 순으로 줄 세우기 (별점 없는 가게는 맨 아래)
  data.sort(function (a, b) {
    const diff = averageScore(b.ratings) - averageScore(a.ratings);
    if (diff !== 0) {
      return diff;
    }
    return b.ratings.length - a.ratings.length;
  });

  // 맛집이 하나도 없을 때 (빈 상태)
  if (data.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";

    const title = document.createElement("strong");
    title.textContent = "아직 등록된 맛집이 없어요";

    const desc = document.createElement("p");
    desc.textContent = "알고 있는 맛집을 처음으로 추가해 보세요!";

    const emptyAddButton = document.createElement("button");
    emptyAddButton.className = "submit-add";
    emptyAddButton.textContent = "+ 맛집 추가";
    emptyAddButton.addEventListener("click", openAddArea);

    empty.append(title, desc, emptyAddButton);
    listArea.append(empty);
  }

  if (data.length > 0) {
    // 목록 맨 위에 맛집 추가 버튼
    // 맨 위 버튼 줄: [+ 맛집 추가] [🎲 오늘 뭐 먹지?]
    const listActions = document.createElement("div");
    listActions.className = "list-actions";

    const topAddButton = document.createElement("button");
    topAddButton.className = "submit-add list-add-button";
    topAddButton.textContent = "+ 맛집 추가";
    topAddButton.addEventListener("click", openAddArea);

    const randomButton = document.createElement("button");
    randomButton.className = "random-button";
    randomButton.textContent = "🎲 오늘 뭐 먹지?";
    randomButton.addEventListener("click", openRandomPick);

    listActions.append(topAddButton, randomButton);
    listArea.append(listActions);
    // 🆕 맛집 추가 안내 문구
    const addHint = document.createElement("p");
    addHint.className = "list-hint";
    addHint.textContent = "💡 지도에서 가게를 눌러 추가하고 싶다면, 먼저 위의 [+ 맛집 추가]를 눌러 주세요!";
    listArea.append(addHint);

    // 🆕 음식 종류 골라보기
    const filterSelect = document.createElement("select");
    filterSelect.className = "category-filter";

    const allOption = document.createElement("option");
    allOption.value = "전체";
    allOption.textContent = "전체 (" + data.length + ")";
    filterSelect.append(allOption);

    CATEGORIES.forEach(function (category) {
      const count = data.filter(function (restaurant) {
        return categoryOf(restaurant) === category;
      }).length;

      const option = document.createElement("option");
      option.value = category;
      option.textContent = category + " (" + count + ")";
      filterSelect.append(option);
    });

    filterSelect.value = selectedCategory;
    filterSelect.addEventListener("change", function () {
      selectedCategory = filterSelect.value;
      listPage = 1; 
      applyFilter();
    });
    listArea.append(filterSelect);
  }


  data.forEach(function (restaurant) {
    // 목록에 카드 추가
    const item = document.createElement("div");
    item.className = "restaurant-item";

    const nameText = document.createElement("strong");
    nameText.textContent = restaurant.name;

    const infoText = document.createElement("p");
    infoText.textContent = restaurant.category + " · " + ratingText(restaurant.ratings);

    item.append(nameText, infoText);
    listArea.append(item);
    cards.push(item);

    item.addEventListener("click", function () {
      showDetail(restaurant);
    });

    // 지도에 핀 추가
    const marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(restaurant.lat, restaurant.lng),
      map: map
    });
    markers.push(marker);

    kakao.maps.event.addListener(marker, "click", function () {
      showDetail(restaurant);
    });
  });
    // 🆕 목록 더보기 버튼
  // 🆕 페이지 넘기기 버튼
  if (data.length > 0) {
    const pager = document.createElement("div");
    pager.className = "pager";

    const prevButton = document.createElement("button");
    prevButton.className = "pager-prev";
    prevButton.textContent = "‹ 이전";
    prevButton.addEventListener("click", function () {
      listPage = listPage - 1;
      applyFilter();
      listArea.scrollTop = 0;
    });

    const pageText = document.createElement("span");
    pageText.className = "pager-text";

    const nextButton = document.createElement("button");
    nextButton.className = "pager-next";
    nextButton.textContent = "다음 ›";
    nextButton.addEventListener("click", function () {
      listPage = listPage + 1;
      applyFilter();
      listArea.scrollTop = 0;
    });

    pager.append(prevButton, pageText, nextButton);
    listArea.append(pager);
  }
  // 🆕 고른 종류에 맛집이 없을 때 안내
  if (data.length > 0) {
    const filterEmpty = document.createElement("p");
    filterEmpty.className = "filter-empty";
    filterEmpty.textContent = "이 종류에는 아직 등록된 맛집이 없어요.";
    filterEmpty.hidden = true;
    listArea.append(filterEmpty);
  }

  restaurants = data;
  applyFilter();
  return data;
}
// 13. 맛집 추가 칸 열고 닫기
function openAddArea() {
  listArea.hidden = true;
  detailArea.hidden = true;
  addArea.hidden = false;
  searchInput.focus();
}

addBackButton.addEventListener("click", function () {
  addArea.hidden = true;
  listArea.hidden = false;
  clearSearchMarker();
});

// 14. 카카오 분류를 우리 음식 종류로 바꾸기
function toCategory(kakaoCategory) {
  const parts = kakaoCategory.split(" > ");
  const second = parts[1];

  if (second === "한식" || second === "중식" || second === "일식" || second === "양식" || second === "분식") {
    return second;
  }
  if (second === "카페" || second === "간식") {
    return "카페·디저트";
  }
  return "기타";
}

// 15. 카카오맵에서 가게 검색하기
const places = new kakao.maps.services.Places();
const PAGE_SIZE = 6; // 한 번에 보여줄 개수

function searchPlaces() {
  const keyword = searchInput.value.trim();

  if (keyword === "") {
    alert("검색할 가게 이름이나 메뉴를 적어 주세요!");
    return;
  }

  selectedPlace = null;
  addForm.hidden = true;
  clearSearchMarker();

  places.keywordSearch(keyword, function (results, status) {
    searchResults.innerHTML = "";
    foundPlaces = [];
    shownCount = 0;

    if (status !== kakao.maps.services.Status.OK) {
      searchResults.textContent = "검색 결과가 없어요. 다른 이름으로 검색해 보세요.";
      return;
    }

    foundPlaces = results.filter(function (place) {
      return place.category_group_code === "FD6" || place.category_group_code === "CE7";
    });

    if (foundPlaces.length === 0) {
      searchResults.textContent = "근처에 맞는 음식점이 없어요. 다른 이름으로 검색해 보세요.";
      return;
    }

    showMorePlaces();
  }, {
    location: center,
    radius: 1000,
    sort: kakao.maps.services.SortBy.DISTANCE
  });
}

searchButton.addEventListener("click", searchPlaces);

searchInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.isComposing) {
    searchPlaces();
  }
});

// 16. 검색 결과 6개씩 보여주기
function showMorePlaces() {
  const oldMoreButton = searchResults.querySelector(".more-button");
  if (oldMoreButton) {
    oldMoreButton.remove();
  }

  const nextPlaces = foundPlaces.slice(shownCount, shownCount + PAGE_SIZE);

  nextPlaces.forEach(function (place) {
    const item = document.createElement("div");
    item.className = "search-result";

    const nameText = document.createElement("strong");
    nameText.textContent = place.place_name;

    const infoText = document.createElement("p");
    const address = place.road_address_name || place.address_name;
    infoText.textContent = toCategory(place.category_name) + " · " + place.distance + "m · " + address;

    item.append(nameText, infoText);
    searchResults.append(item);

    item.addEventListener("click", function () {
      selectPlace(place, item);
    });
  });

  shownCount = shownCount + nextPlaces.length;

  if (shownCount < foundPlaces.length) {
    const moreButton = document.createElement("button");
    moreButton.className = "more-button";
    moreButton.textContent = "더보기 (" + (foundPlaces.length - shownCount) + "개 더)";
    moreButton.addEventListener("click", showMorePlaces);
    searchResults.append(moreButton);
  }
}
// 16-1. 분홍 별 핀 그림 만들기
const pinkStarSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">' +
  '<path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z" fill="#ea5079"/>' +
  '<polygon points="16,9 17.76,13.57 22.66,13.84 18.85,16.93 20.11,21.66 16,19 11.89,21.66 13.15,16.93 9.34,13.84 14.24,13.57" fill="white"/>' +
  '</svg>';

const pinkStarImage = new kakao.maps.MarkerImage(
  "data:image/svg+xml;charset=utf-8," + encodeURIComponent(pinkStarSvg),
  new kakao.maps.Size(32, 42),
  { offset: new kakao.maps.Point(16, 42) }
);

// 17. 임시 핀 뽑기
function clearSearchMarker() {
  if (searchMarker !== null) {
    searchMarker.setMap(null);
    searchMarker = null;
  }
}

// 18. 검색 결과에서 가게 고르기
function selectPlace(place, item) {
  const existing = restaurants.find(function (restaurant) {
    return restaurant.kakao_place_id === place.id;
  });

  if (existing) {
    alert("이미 등록된 가게예요! 그 가게를 보여드릴게요.");
    clearSearchMarker();
    showDetail(existing, true);
    return;
  }

  selectedPlace = place;

  document.querySelectorAll(".search-result").forEach(function (result) {
    result.classList.remove("on");
  });
  item.classList.add("on");

  selectedPlaceText.textContent = "고른 가게: " + place.place_name;
  addCategorySelect.value = toCategory(place.category_name);
  addForm.hidden = false;
  addScore = 0;
  paintStars(addStarButtons, addScore);

  const position = new kakao.maps.LatLng(place.y, place.x);

  clearSearchMarker();
  searchMarker = new kakao.maps.Marker({
    position: position,
    map: map,
    image: pinkStarImage
  });

  map.panTo(position);
}

// 19. 추가하기 버튼
submitAddButton.addEventListener("click", async function () {
  const userName = addUserNameInput.value.trim();

  if (selectedPlace === null) {
    alert("검색 결과에서 가게를 먼저 골라 주세요!");
    return;
  }
  if (userName === "") {
    alert("이름(닉네임)을 적어 주세요!");
    return;
  }

  const { data: newRows, error } = await db.from("restaurants").insert({
    name: selectedPlace.place_name,
    category: addCategorySelect.value,
    lat: Number(selectedPlace.y),
    lng: Number(selectedPlace.x),
    address: selectedPlace.road_address_name || selectedPlace.address_name,
    kakao_place_id: selectedPlace.id,
    kakao_url: selectedPlace.place_url,
    created_by: userName
  }).select();

  if (error) {
    if (error.code === "23505") {
      alert("이미 등록된 가게예요!");
    } else {
      alert("맛집을 추가하지 못했어요. 다시 시도해 주세요.");
    }
    console.log("맛집 추가 실패:", error);
    return;
  }

  // 별을 골랐으면 별점도 같이 저장
  if (addScore > 0) {
    const { error: ratingError } = await db.from("ratings").insert({
      restaurant_id: newRows[0].id,
      user_name: userName,
      score: addScore
    });

    if (ratingError) {
      alert("맛집은 추가했지만 별점은 저장하지 못했어요. 자세히 보기에서 다시 남겨 주세요.");
      console.log("별점 저장 실패:", ratingError);
    }
  }

  rememberName(userName);
  alert(selectedPlace.place_name + " 추가 완료! 🎉");

  const data = await loadRestaurants();
  const added = data.find(function (restaurant) {
    return restaurant.kakao_place_id === selectedPlace.id;
  });

  searchInput.value = "";
  searchResults.innerHTML = "";
  addForm.hidden = true;
  selectedPlace = null;
  addScore = 0;
  clearSearchMarker();

  // 목록으로 돌아가고, 지도는 새로 추가한 가게로 이동
  addArea.hidden = true;
  listArea.hidden = false;
  map.panTo(new kakao.maps.LatLng(added.lat, added.lng));
});

// 20. 맛집 삭제하기
deleteButton.addEventListener("click", async function () {
  const ok = confirm("'" + selectedRestaurant.name + "'을(를) 정말 지울까요?\n남긴 별점도 함께 지워져요.");
  if (!ok) {
    return;
  }

  const { error } = await db.from("restaurants").delete().eq("id", selectedRestaurant.id);

  if (error) {
    alert("맛집을 지우지 못했어요. 다시 시도해 주세요.");
    console.log("맛집 삭제 실패:", error);
    return;
  }

  alert("지웠어요!");

  await loadRestaurants();
  detailArea.hidden = true;
  listArea.hidden = false;
});

// 21. 내 이름 기억하기
function rememberName(name) {
  localStorage.setItem("userName", name);
  userNameInput.value = name;
  addUserNameInput.value = name;
}

const savedName = localStorage.getItem("userName");
if (savedName) {
  userNameInput.value = savedName;
  addUserNameInput.value = savedName;
}
// 22. 지도에서 누른 곳 근처의 가게 찾기 (맛집 추가 화면에서만)
kakao.maps.event.addListener(map, "click", function (mouseEvent) {
  if (addArea.hidden) {
    return;
  }

  const clickedPosition = mouseEvent.latLng;
  const options = {
    location: clickedPosition,
    radius: 50,
    sort: kakao.maps.services.SortBy.DISTANCE
  };

  selectedPlace = null;
  addForm.hidden = true;
  clearSearchMarker();
  searchInput.value = "";

  places.categorySearch("FD6", function (foodResults, foodStatus) {
    places.categorySearch("CE7", function (cafeResults, cafeStatus) {
      let nearby = [];
      if (foodStatus === kakao.maps.services.Status.OK) {
        nearby = nearby.concat(foodResults);
      }
      if (cafeStatus === kakao.maps.services.Status.OK) {
        nearby = nearby.concat(cafeResults);
      }

      // 누른 곳에서 가까운 순으로 줄 세우기
      nearby.sort(function (a, b) {
        return Number(a.distance) - Number(b.distance);
      });

      // 거리를 "회사에서부터"로 다시 재기
      nearby.forEach(function (place) {
        const line = new kakao.maps.Polyline({
          path: [center, new kakao.maps.LatLng(place.y, place.x)]
        });
        place.distance = String(Math.round(line.getLength()));
      });

      // 회사에서 1km 안의 가게만
      nearby = nearby.filter(function (place) {
        return Number(place.distance) <= 1000;
      });

      searchResults.innerHTML = "";
      foundPlaces = nearby;
      shownCount = 0;

      if (foundPlaces.length === 0) {
        searchResults.textContent = "누른 곳 근처에 맛집이 없어요. 가게 이름 위를 정확히 눌러 보세요. (회사에서 1km 안만 돼요)";
        return;
      }

      showMorePlaces();
    }, options);
  }, options);
});
// 23. 맛집 추가할 때 별 누르기
addStarButtons.forEach(function (star) {
  star.addEventListener("click", function () {
    addScore = Number(star.dataset.score);
    paintStars(addStarButtons, addScore);
  });
});
// 24. 음식 종류 정리하기 (목록에 없는 종류는 기타로)
function categoryOf(restaurant) {
  if (CATEGORIES.includes(restaurant.category)) {
    return restaurant.category;
  }
  return "기타";
}

// 25. 고른 음식 종류를, 지금 페이지 것만 보여주기
function applyFilter() {
  function isMatch(restaurant) {
    return selectedCategory === "전체" || categoryOf(restaurant) === selectedCategory;
  }

  // 1) 고른 종류에 맞는 가게가 몇 개인지 먼저 세기
  let matchCount = 0;
  restaurants.forEach(function (restaurant) {
    if (isMatch(restaurant)) {
      matchCount = matchCount + 1;
    }
  });

  // 2) 전체 페이지 수 계산하고, 지금 페이지가 범위를 벗어나지 않게
  const totalPages = Math.max(1, Math.ceil(matchCount / LIST_PAGE_SIZE));
  if (listPage > totalPages) {
    listPage = totalPages;
  }
  if (listPage < 1) {
    listPage = 1;
  }

  // 3) 이 페이지에 보여줄 순서 범위 (0부터 세요!)
  const start = (listPage - 1) * LIST_PAGE_SIZE;
  const end = start + LIST_PAGE_SIZE;

  // 4) 카드와 핀 보여주기 / 숨기기
  let order = 0;
  restaurants.forEach(function (restaurant, index) {
    if (isMatch(restaurant)) {
      markers[index].setMap(map);
      cards[index].hidden = !(order >= start && order < end);
      order = order + 1;
    } else {
      markers[index].setMap(null);
      cards[index].hidden = true;
    }
  });

  // 5) 안내 문구와 페이지 버튼 정리
  const filterEmpty = listArea.querySelector(".filter-empty");
  if (filterEmpty) {
    filterEmpty.hidden = matchCount > 0;
  }

  const pager = listArea.querySelector(".pager");
  if (pager) {
    pager.hidden = totalPages <= 1;
    pager.querySelector(".pager-text").textContent = listPage + " / " + totalPages;

    // 첫 페이지에선 [이전], 마지막 페이지에선 [다음]을 숨기기 (자리는 그대로)
    if (listPage === 1) {
      pager.querySelector(".pager-prev").style.visibility = "hidden";
    } else {
      pager.querySelector(".pager-prev").style.visibility = "visible";
    }

    if (listPage === totalPages) {
      pager.querySelector(".pager-next").style.visibility = "hidden";
    } else {
      pager.querySelector(".pager-next").style.visibility = "visible";
    }
  }
}

// 26. 음식 종류 목록 만들기 (맛집 추가 칸, 수정 칸)
CATEGORIES.forEach(function (category) {
  const addOption = document.createElement("option");
  addOption.textContent = category;
  addCategorySelect.append(addOption);

  const editOption = document.createElement("option");
  editOption.textContent = category;
  editCategorySelect.append(editOption);
});
// 27. 음식 종류 수정하기
editButton.addEventListener("click", function () {
  editCategorySelect.value = categoryOf(selectedRestaurant);
  editForm.hidden = false;
});

cancelEditButton.addEventListener("click", function () {
  editForm.hidden = true;
});

saveEditButton.addEventListener("click", async function () {
  const newCategory = editCategorySelect.value;

  const { error } = await db.from("restaurants")
    .update({ category: newCategory })
    .eq("id", selectedRestaurant.id);

  if (error) {
    alert("음식 종류를 바꾸지 못했어요. 다시 시도해 주세요.");
    console.log("음식 종류 수정 실패:", error);
    return;
  }

  alert("음식 종류를 '" + newCategory + "'(으)로 바꿨어요!");

  const data = await loadRestaurants();
  const updated = data.find(function (restaurant) {
    return restaurant.id === selectedRestaurant.id;
  });
  showDetail(updated, cameFromSearch);
});

// 28. 가게 리뷰(한 줄 평) 목록 그리기
function renderReviews(restaurant) {
  reviewList.innerHTML = "";

  const reviews = restaurant.ratings.filter(function (rating) {
    return rating.comment;
  });

  reviews.sort(function (a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const title = document.createElement("strong");
  title.textContent = "🏪 가게 리뷰 (" + reviews.length + ")";
  reviewList.append(title);

  if (reviews.length === 0) {
    const empty = document.createElement("p");
    empty.className = "review-empty";
    empty.textContent = "아직 한 줄 평이 없어요. 첫 번째로 남겨 보세요!";
    reviewList.append(empty);
    return;
  }

  reviews.forEach(function (review) {
    const item = document.createElement("div");
    item.className = "review-item";

    const text = document.createElement("p");
    text.textContent = "★" + review.score + "  \"" + review.comment + "\"";

    const writer = document.createElement("span");
    writer.textContent = "- " + review.user_name;

    item.append(text, writer);
    reviewList.append(item);
  });
}

// 29. 메뉴 목록 그리기
function renderMenus(restaurant) {
  menuReviewForm.hidden = true;
  menuList.innerHTML = "";
  const menus = restaurant.menus;

  if (menus.length === 0) {
    const empty = document.createElement("p");
    empty.className = "review-empty";
    empty.textContent = "아직 등록된 메뉴가 없어요. 먹어 본 메뉴를 올려 주세요!";
    menuList.append(empty);
    return;
  }

  // 먼저 올린 메뉴가 위로
  menus.sort(function (a, b) {
    return a.id - b.id;
  });

  const myName = userNameInput.value.trim();

  menus.forEach(function (menu) {
    const item = document.createElement("div");
    item.className = "menu-item";

    // 윗줄: 메뉴 이름 / 가격 · 별점 / [리뷰] 버튼
    const top = document.createElement("div");
    top.className = "menu-top";

    const nameText = document.createElement("strong");
    nameText.textContent = menu.name;

    let infoText = "";
    if (menu.price !== null) {
      infoText = menu.price.toLocaleString() + "원 · ";
    }
    infoText = infoText + ratingText(menu.menu_reviews);

    const info = document.createElement("span");
    info.textContent = infoText;

    const reviewButton = document.createElement("button");
    reviewButton.className = "menu-review-button";
    const mine = menu.menu_reviews.find(function (review) {
      return review.user_name === myName;
    });
    if (mine) {
      reviewButton.textContent = "리뷰 고치기";
    } else {
      reviewButton.textContent = "리뷰";
    }
    reviewButton.addEventListener("click", function () {
      openMenuReview(menu, item);
    });

    top.append(nameText, info, reviewButton);
    item.append(top);

    // 아랫줄: 메뉴 한 줄 평들 (최신순)
    const comments = menu.menu_reviews.filter(function (review) {
      return review.comment;
    });
    comments.sort(function (a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    });
    comments.forEach(function (review) {
      const comment = document.createElement("p");
      comment.className = "menu-comment";
      comment.textContent = "\"" + review.comment + "\" - " + review.user_name;
      item.append(comment);
    });

    menuList.append(item);
  });
}

// 30. 메뉴 추가 칸 열고 닫기
menuAddToggle.addEventListener("click", function () {
  menuAddForm.hidden = false;
  menuNameInput.focus();
});

cancelMenuButton.addEventListener("click", function () {
  menuNameInput.value = "";
  menuPriceInput.value = "";
  menuAddForm.hidden = true;
});

// 31. 메뉴 추가하기
saveMenuButton.addEventListener("click", async function () {
  const menuName = menuNameInput.value.trim();
  const priceText = menuPriceInput.value.trim();
  const userName = userNameInput.value.trim();

  if (menuName === "") {
    alert("메뉴 이름을 적어 주세요!");
    return;
  }
  if (userName === "") {
    alert("위쪽 '내 이름(닉네임)' 칸에 이름을 먼저 적어 주세요!");
    userNameInput.focus();
    return;
  }

  let price = null;
  if (priceText !== "") {
    price = Number(priceText);
  }

  const { error } = await db.from("menus").insert({
    restaurant_id: selectedRestaurant.id,
    name: menuName,
    price: price,
    created_by: userName
  });

  if (error) {
    if (error.code === "23505") {
      alert("이 가게에 같은 이름의 메뉴가 이미 있어요!");
    } else {
      alert("메뉴를 추가하지 못했어요. 다시 시도해 주세요.");
    }
    console.log("메뉴 추가 실패:", error);
    return;
  }

  rememberName(userName);
  menuNameInput.value = "";
  menuPriceInput.value = "";
  alert(menuName + " 메뉴를 추가했어요! 🍲");

  const data = await loadRestaurants();
  const updated = data.find(function (restaurant) {
    return restaurant.id === selectedRestaurant.id;
  });
  showDetail(updated, cameFromSearch);
});

// 32. 메뉴 리뷰 칸 열기 (누른 메뉴 아래로 옮겨 가기)
function openMenuReview(menu, item) {
  selectedMenu = menu;

  const myName = userNameInput.value.trim();
  const mine = menu.menu_reviews.find(function (review) {
    return review.user_name === myName;
  });

  if (mine) {
    menuScore = mine.score;
    menuReviewComment.value = mine.comment || "";
    saveMenuReviewButton.textContent = "리뷰 고치기";
  } else {
    menuScore = 0;
    menuReviewComment.value = "";
    saveMenuReviewButton.textContent = "리뷰 남기기";
  }
  paintStars(menuStarButtons, menuScore);

  item.append(menuReviewForm);
  menuReviewForm.hidden = false;
}

// 33. 메뉴 리뷰 별 누르기
menuStarButtons.forEach(function (star) {
  star.addEventListener("click", function () {
    menuScore = Number(star.dataset.score);
    paintStars(menuStarButtons, menuScore);
  });
});

cancelMenuReviewButton.addEventListener("click", function () {
  menuReviewForm.hidden = true;
});

// 34. 메뉴 리뷰 남기기
saveMenuReviewButton.addEventListener("click", async function () {
  const userName = userNameInput.value.trim();

  if (userName === "") {
    alert("위쪽 '내 이름(닉네임)' 칸에 이름을 먼저 적어 주세요!");
    userNameInput.focus();
    return;
  }
  if (menuScore === 0) {
    alert("별을 1개 이상 눌러 주세요!");
    return;
  }

  const { error } = await db.from("menu_reviews").upsert(
    {
      menu_id: selectedMenu.id,
      user_name: userName,
      score: menuScore,
      comment: menuReviewComment.value.trim() || null
    },
    { onConflict: "menu_id,user_name" }
  );

  if (error) {
    alert("메뉴 리뷰를 저장하지 못했어요. 다시 시도해 주세요.");
    console.log("메뉴 리뷰 저장 실패:", error);
    return;
  }

  rememberName(userName);
  alert(selectedMenu.name + " 리뷰를 남겼어요! ⭐");

  const data = await loadRestaurants();
  const updated = data.find(function (restaurant) {
    return restaurant.id === selectedRestaurant.id;
  });
  showDetail(updated, cameFromSearch);
});

// 35. 화면 크기가 바뀌면 지도 크기 다시 맞추기
window.addEventListener("resize", function () {
  map.relayout();
});

// 36. 🎲 오늘 뭐 먹지? 슬롯머신
const randomOverlay = document.querySelector(".random-overlay");
const randomScope = document.querySelector(".random-scope");
const slotWindow = document.querySelector(".slot-window");
const slotName = document.querySelector(".slot-name");
const slotInfo = document.querySelector(".slot-info");
const randomQuestion = document.querySelector(".random-question");
const randomGoButton = document.querySelector(".random-go");
const randomAgainButton = document.querySelector(".random-again");
const randomCloseButton = document.querySelector(".random-close");

let randomCandidates = []; // 이번에 뽑을 후보 가게들
let randomPicked = null;   // 뽑힌 가게
let isSpinning = false;    // 지금 돌아가는 중인지

// 슬롯머신 창 열기
function openRandomPick() {
  // 골라보기에서 고른 음식 종류 안에서만 뽑아요
  randomCandidates = restaurants.filter(function (restaurant) {
    return selectedCategory === "전체" || categoryOf(restaurant) === selectedCategory;
  });

  if (randomCandidates.length === 0) {
    alert("추천할 맛집이 없어요. 먼저 맛집을 추가해 주세요!");
    return;
  }

  if (selectedCategory === "전체") {
    randomScope.textContent = "등록된 맛집 " + randomCandidates.length + "곳 중에서 골라요";
  } else {
    randomScope.textContent = selectedCategory + " " + randomCandidates.length + "곳 중에서 골라요";
  }

  randomPicked = null;
  randomOverlay.hidden = false;
  spinSlot();
}

// 슬롯 돌리기: 처음엔 빠르게, 점점 느려지다가 멈춰요
function spinSlot() {
  isSpinning = true;
  randomGoButton.disabled = true;
  randomAgainButton.disabled = true;
  randomQuestion.style.visibility = "hidden";
  slotInfo.textContent = "";
  slotWindow.classList.remove("winner");

  // 결과를 먼저 정해 두기 (방금 나온 가게는 되도록 피하기)
  let pool = randomCandidates;
  if (randomPicked !== null && randomCandidates.length > 1) {
    pool = randomCandidates.filter(function (restaurant) {
      return restaurant.id !== randomPicked.id;
    });
  }
  const result = pool[Math.floor(Math.random() * pool.length)];

  // 움직임 줄이기를 켠 사람에게는 애니메이션 없이 바로 보여주기
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || randomCandidates.length === 1) {
    finishSpin(result);
    return;
  }

  let delay = 50;
  let index = Math.floor(Math.random() * randomCandidates.length);

  function nextName() {
    index = (index + 1) % randomCandidates.length;
    slotName.textContent = randomCandidates[index].name;

    delay = delay * 1.12;
    if (delay < 320) {
      setTimeout(nextName, delay);
    } else {
      setTimeout(function () {
        finishSpin(result);
      }, delay);
    }
  }

  nextName();
}

// 멈추고 결과 보여주기
function finishSpin(result) {
  randomPicked = result;
  slotName.textContent = result.name;
  slotInfo.textContent = result.category + " · " + ratingText(result.ratings);
  slotWindow.classList.add("winner");
  randomQuestion.style.visibility = "visible";

  randomGoButton.disabled = false;
  randomAgainButton.disabled = randomCandidates.length <= 1;
  isSpinning = false;
}

// 슬롯머신 창 닫기
function closeRandomPick() {
  if (isSpinning) {
    return;
  }
  randomOverlay.hidden = true;
}

randomGoButton.addEventListener("click", function () {
  randomOverlay.hidden = true;
  showDetail(randomPicked);
});

randomAgainButton.addEventListener("click", spinSlot);
randomCloseButton.addEventListener("click", closeRandomPick);

// 창 바깥(어두운 곳)을 누르거나 Esc 키를 누르면 닫기
randomOverlay.addEventListener("click", function (event) {
  if (event.target === randomOverlay) {
    closeRandomPick();
  }
});
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && !randomOverlay.hidden) {
    closeRandomPick();
  }
});

loadRestaurants();