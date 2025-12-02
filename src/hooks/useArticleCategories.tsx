import { useState, useEffect } from "react";
import axios from "axios";

export const useArticleCategories = () => {
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [categoriesError, setCategoriesError] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            setCategoriesLoading(true);
            setCategoriesError(null);

            try {
                const response = await axios.get(
                    "https://interactapiverse.com/mahadevasth/shape/articles/article-categories"
                );

                const cats = response.data?.data || response.data?.categories || response.data;

                if (Array.isArray(cats)) {
                    setCategories(cats.filter((c) => c && typeof c.category === "string" && c.category));
                } else {
                    setCategories([]);
                }
            } catch (err) {
                setCategoriesError("Failed to load categories");
                setCategories([]);
            } finally {
                setCategoriesLoading(false);
            }
        };

        fetchCategories();
    }, []);

    return { categories, categoriesLoading, categoriesError };
};
