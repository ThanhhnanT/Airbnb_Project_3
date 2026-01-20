"use client";

import React, { useEffect, useState } from "react";
import { 
  Layout, 
  Row, 
  Col, 
  Typography, 
  Spin, 
  Button, 
  Select, 
  Modal, 
  Checkbox,
  Statistic,
  Space,
  Divider
} from "antd";
import {
  EnvironmentOutlined,
  HomeOutlined,
  ApartmentOutlined,
  BankOutlined,
  CarOutlined,
  FireOutlined,
  TrophyOutlined,
  TeamOutlined,
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
  LeftOutlined,
  RightOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { searchListings, Listing, SearchParams } from "@/service/listings";
import CategoryCard from "@/components/home/CategoryCard";
import HomeListingCard from "@/components/home/HomeListingCard";
import styles from "@/styles/home.module.css";

const { Title } = Typography;
const { Option } = Select;
const { Footer } = Layout;

const categories = [
  { icon: <EnvironmentOutlined />, label: "Bãi biển", filterValue: "beach", filterType: "amenity" as const },
  { icon: <TrophyOutlined />, label: "Núi", filterValue: "mountain", filterType: "amenity" as const },
  { icon: <BankOutlined />, label: "Thành phố", filterValue: "city", filterType: "city" as const },
  { icon: <HomeOutlined />, label: "Nông thôn", filterValue: "rural", filterType: "city" as const },
  { icon: <CarOutlined />, label: "Hồ bơi", filterValue: "pool", filterType: "amenity" as const },
  { icon: <FireOutlined />, label: "Lâu đài", filterValue: "castle", filterType: "amenity" as const },
];

const propertyTypes = [
  { label: "Tất cả", value: "all" },
  { label: "Nhà riêng", value: "house" },
  { label: "Căn hộ", value: "apartment" },
  { label: "Biệt thự", value: "villa" },
  { label: "Phòng", value: "room" },
];

const priceRanges = [
  { label: "Mức giá", value: "all" },
  { label: "Dưới ₫1,000,000", value: "0-1000000" },
  { label: "₫1,000,000 - ₫2,000,000", value: "1000000-2000000" },
  { label: "Trên ₫2,000,000", value: "2000000-999999999" },
];

const bedroomOptions = [
  { label: "Phòng ngủ", value: "all" },
  { label: "1 phòng", value: "1" },
  { label: "2 phòng", value: "2" },
  { label: "3+ phòng", value: "3" },
];

const amenitiesOptions = [
  "WiFi",
  "Máy lạnh",
  "Bếp",
  "Máy giặt",
  "Bãi đỗ xe",
  "Hồ bơi",
  "Phòng gym",
  "Spa",
];

export default function Home() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categoryListings, setCategoryListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [selectedPropertyType, setSelectedPropertyType] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [selectedBedrooms, setSelectedBedrooms] = useState("all");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [amenitiesModalVisible, setAmenitiesModalVisible] = useState(false);
  const [categoryScrollPosition, setCategoryScrollPosition] = useState(0);

  // Fetch listings for categories section (initial load)
  useEffect(() => {
    fetchCategoryListings();
  }, []);

  // Fetch filtered listings
  useEffect(() => {
    fetchListings();
  }, [selectedPropertyType, selectedPriceRange, selectedBedrooms, selectedAmenities]);

  const fetchCategoryListings = async () => {
    try {
      setCategoryLoading(true);
      const result = await searchListings({
        limit: 8,
        page: 1,
        sort_by: "createdAt",
        sort_order: "desc",
      });
      setCategoryListings(result?.data || []);
    } catch (error) {
      console.error("Error fetching category listings:", error);
    } finally {
      setCategoryLoading(false);
    }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params: SearchParams = {
        limit: 20,
        page: 1,
        sort_by: "createdAt",
        sort_order: "desc",
      };

      // Apply price filter
      if (selectedPriceRange !== "all") {
        const [min, max] = selectedPriceRange.split("-").map(Number);
        params.min_price = min;
        params.max_price = max;
      }

      // Bedrooms filter (backend)
      if (selectedBedrooms !== "all") {
        const bedrooms = parseInt(selectedBedrooms);
        params.bedrooms_min = bedrooms === 3 ? 3 : bedrooms;
      }

      // Amenities filter (backend) - any-of
      if (selectedAmenities.length > 0) {
        params.amenities = selectedAmenities;
      }

      const result = await searchListings(params);
      let filteredListings = result?.data || [];

      // Filter by property type (based on title keywords) - still client-side until backend has field
      if (selectedPropertyType !== "all") {
        filteredListings = filteredListings.filter((listing) => {
          const title = listing.title.toLowerCase();
          switch (selectedPropertyType) {
            case "house":
              return title.includes("nhà") || title.includes("house");
            case "apartment":
              return title.includes("căn hộ") || title.includes("apartment");
            case "villa":
              return title.includes("biệt thự") || title.includes("villa");
            case "room":
              return title.includes("phòng") || title.includes("room");
            default:
              return true;
          }
        });
      }

      setListings(filteredListings);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollCategories = (direction: "left" | "right") => {
    const container = document.getElementById("categories-container");
    if (container) {
      const scrollAmount = 300;
      const newPosition =
        direction === "left"
          ? categoryScrollPosition - scrollAmount
          : categoryScrollPosition + scrollAmount;
      container.scrollTo({
        left: newPosition,
        behavior: "smooth",
      });
      setCategoryScrollPosition(newPosition);
    }
  };

  return (
    <Layout className={styles.homeLayout}>
        <div className={styles.homeContent}>
        {/* Categories Section */}
        <section className={styles.categoriesSection}>
          <Title level={2} className={styles.sectionTitle}>
            Khám phá các danh mục nổi tiếng
          </Title>
          <div className={styles.categoriesWrapper}>
            <Button
              type="text"
              icon={<LeftOutlined />}
              className={styles.scrollButton}
              onClick={() => scrollCategories("left")}
            />
            <div id="categories-container" className={styles.categoriesContainer}>
              <Row gutter={[16, 16]} className={styles.categoriesRow}>
                {categories.map((category, index) => (
                  <Col key={index} xs={8} sm={6} md={4} lg={4}>
                    <CategoryCard
                      icon={category.icon}
                      label={category.label}
                      filterValue={category.filterValue}
                      filterType={category.filterType}
                    />
                  </Col>
                ))}
              </Row>
            </div>
            <Button
              type="text"
              icon={<RightOutlined />}
              className={styles.scrollButton}
              onClick={() => scrollCategories("right")}
            />
          </div>
        </section>

        {/* Category Listings Section - Hiển thị ngay sau categories */}
        <section className={styles.categoryListingsSection}>
          {categoryLoading ? (
            <div className={styles.loadingContainer}>
              <Spin size="large" />
            </div>
          ) : categoryListings.length > 0 ? (
            <Row gutter={[24, 24]} className={styles.categoryListingsGrid}>
              {categoryListings.map((listing) => (
                <Col
                  key={listing._id}
                  xs={24}
                  sm={12}
                  md={8}
                  lg={6}
                  xl={6}
                >
                  <HomeListingCard listing={listing} />
                </Col>
              ))}
            </Row>
          ) : null}
        </section>

        {/* Listings Section */}
        <section className={styles.listingsSection}>
          <Title level={2} className={styles.sectionTitle}>
            Địa điểm được đề xuất cho bạn
          </Title>

          {/* Filters */}
          <div className={styles.filtersContainer}>
            <Space size="middle" wrap>
              {propertyTypes.map((type) => (
                <Button
                  key={type.value}
                  type={selectedPropertyType === type.value ? "primary" : "default"}
                  onClick={() => setSelectedPropertyType(type.value)}
                  className={styles.filterButton}
                >
                  {type.label}
                </Button>
              ))}
              <Divider type="vertical" />
              <Select
                value={selectedPriceRange}
                onChange={setSelectedPriceRange}
                className={styles.filterSelect}
                style={{ width: 200 }}
              >
                {priceRanges.map((range) => (
                  <Option key={range.value} value={range.value}>
                    {range.label}
                  </Option>
                ))}
              </Select>
              <Select
                value={selectedBedrooms}
                onChange={setSelectedBedrooms}
                className={styles.filterSelect}
                style={{ width: 150 }}
              >
                {bedroomOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
              <Button
                icon={<CarOutlined />}
                onClick={() => setAmenitiesModalVisible(true)}
                className={styles.filterButton}
              >
                Thêm tiện nghi
              </Button>
            </Space>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className={styles.loadingContainer}>
              <Spin size="large" />
            </div>
          ) : listings.length === 0 ? (
            <div className={styles.emptyContainer}>
              <p>Không tìm thấy kết quả phù hợp</p>
            </div>
          ) : (
            <Row gutter={[24, 24]} className={styles.listingsGrid}>
              {listings.map((listing) => (
                <Col
                  key={listing._id}
                  xs={24}
                  sm={12}
                  md={8}
                  lg={6}
                  xl={6}
                >
                  <HomeListingCard listing={listing} />
                </Col>
              ))}
            </Row>
          )}
        </section>

        {/* Community Stats Section */}
        <section className={styles.statsSection}>
          <div className={styles.statsContent}>
            <Title level={2} className={styles.statsTitle}>
              Cộng đồng của chúng tôi
            </Title>
            <p className={styles.statsDescription}>
              Tham gia cùng hàng triệu người dùng và chủ nhà trên toàn thế giới đã tin tưởng và lựa chọn chúng tôi cho những chuyến đi của họ.
            </p>
            <Row gutter={[32, 32]} className={styles.statsRow}>
              <Col xs={24} md={12}>
                <div className={styles.statCard}>
                  <TeamOutlined className={styles.statIcon} />
                  <Statistic
                    title="Người dùng đã đăng ký"
                    value={1500000}
                    suffix="+"
                    valueStyle={{ color: "#ff385c", fontSize: "48px" }}
                  />
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className={styles.statCard}>
                  <HomeOutlined className={styles.statIcon} />
                  <Statistic
                    title="Nhà nghỉ và trải nghiệm"
                    value={250000}
                    suffix="+"
                    valueStyle={{ color: "#ff385c", fontSize: "48px" }}
                  />
                </div>
              </Col>
            </Row>
          </div>
        </section>

        {/* System Info Section */}
        <section className={styles.systemSection}>
          <div className={styles.systemContent}>
            <Title level={2} className={styles.systemTitle}>
              Hệ thống đặt phòng ưu việt
            </Title>
            <p className={styles.systemDescription}>
              Khám phá hàng ngàn chỗ ở và trải nghiệm độc đáo trên khắp thế giới. Từ những căn hộ ấm cúng cho đến các biệt thự sang trọng, chúng tôi mang đến cho bạn một kỳ nghỉ hoàn hảo với quy trình đặt phòng an toàn, nhanh chóng và dịch vụ hỗ trợ khách hàng 24/7.
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerMain}>
            <div className={styles.footerText}>
              <p>© 2024 Airbnb Clone. Đã đăng ký bản quyền.</p>
              <div className={styles.footerLinks}>
                <span>·</span>
                <a href="#" className={styles.footerLink}>
                  Chính sách bảo mật
                </a>
                <span>·</span>
                <a href="#" className={styles.footerLink}>
                  Điều khoản dịch vụ
                </a>
              </div>
            </div>
            <div className={styles.socialLinks}>
              <a href="#" className={styles.socialLink}>
                <FacebookOutlined />
              </a>
              <a href="#" className={styles.socialLink}>
                <TwitterOutlined />
              </a>
              <a href="#" className={styles.socialLink}>
                <InstagramOutlined />
              </a>
            </div>
          </div>
          <div className={styles.footerMobileLinks}>
            <a href="#" className={styles.footerLink}>
              Chính sách bảo mật
            </a>
            <a href="#" className={styles.footerLink}>
              Điều khoản dịch vụ
            </a>
          </div>
        </div>
      </Footer>

      {/* Amenities Modal */}
      <Modal
        title="Chọn tiện nghi"
        open={amenitiesModalVisible}
        onOk={() => setAmenitiesModalVisible(false)}
        onCancel={() => setAmenitiesModalVisible(false)}
        okText="Áp dụng"
        cancelText="Hủy"
      >
        <Checkbox.Group
          value={selectedAmenities}
          onChange={setSelectedAmenities}
          className={styles.amenitiesGroup}
        >
          <Row gutter={[16, 16]}>
            {amenitiesOptions.map((amenity) => (
              <Col span={12} key={amenity}>
                <Checkbox value={amenity}>{amenity}</Checkbox>
              </Col>
            ))}
          </Row>
        </Checkbox.Group>
      </Modal>
    </Layout>
  );
}
