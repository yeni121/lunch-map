// 1. Supabase(공용 게시판) 연결하기
const SUPABASE_URL = "https://febmbzezpreyhibumobd.supabase.co";
const SUPABASE_KEY = "sb_publishable_1pHYkRanaYtxXH5LhjDTag_x1WTs7TF";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. 지도 그리기
const mapArea = document.querySelector(".map-area");
const center = new kakao.maps.LatLng(37.4959, 127.1244);
const map = new kakao.maps.Map(mapArea, {
  center: center,
  level: 3
});

// 3. 회사 핀 꽂기
const companyMarker = new kakao.maps.Marker({
  position: center,
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
const starButtons = document.querySelectorAll(".detail-area .star");
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
    submitRatingButton.textContent = "별점 고치기";
  } else {
    selectedScore = 0;
    submitRatingButton.textContent = "별점 남기기";
  }
  paintStars();

  detailName.textContent = restaurant.name;
  detailInfo.textContent = restaurant.category;
  detailRating.textContent = ratingText(restaurant.ratings);

  listArea.hidden = true;
  addArea.hidden = true;
  detailArea.hidden = false;
  editForm.hidden = true;

  map.panTo(new kakao.maps.LatLng(restaurant.lat, restaurant.lng));
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
      score: selectedScore
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
// 12. 게시판에서 맛집 불러와서 보여주기
async function loadRestaurants() {
  const { data, error } = await db.from("restaurants").select("*, ratings(score, user_name)");

  if (error) {
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
    return averageScore(b.ratings) - averageScore(a.ratings);
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
    const topAddButton = document.createElement("button");
    topAddButton.className = "submit-add list-add-button";
    topAddButton.textContent = "+ 맛집 추가";
    topAddButton.addEventListener("click", openAddArea);
    listArea.append(topAddButton);

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

// 25. 고른 음식 종류만 보여주기
function applyFilter() {
  let visibleCount = 0;

  restaurants.forEach(function (restaurant, index) {
    const show = selectedCategory === "전체" || categoryOf(restaurant) === selectedCategory;

    cards[index].hidden = !show;
    if (show) {
      markers[index].setMap(map);
      visibleCount = visibleCount + 1;
    } else {
      markers[index].setMap(null);
    }
  });

  const filterEmpty = listArea.querySelector(".filter-empty");
  if (filterEmpty) {
    filterEmpty.hidden = visibleCount > 0;
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

loadRestaurants();