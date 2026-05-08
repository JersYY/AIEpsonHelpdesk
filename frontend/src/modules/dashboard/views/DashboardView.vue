<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import dashboardService from '../../../services/dashboard.service'

import '../../../assets/styles/dashboard.css'

import QuickActionCard from '../components/QuickActionCard.vue'
import PopularIssueCard from '../components/PopularIssueCard.vue'
import RecentActivityCard from '../components/RecentActivityCard.vue'

const router = useRouter()
const goToChat = () => {
    router.push('/chat')
}

const user = ref({})
const popularIssues = ref([])
const recentActivity = ref([])

const loading = ref(false)
const showLogoutModal = ref(false)

const logout = () => {
    localStorage.removeItem('token')

    router.push('/')
}

const formatDate = (date) => {
    return new Date(date).toLocaleDateString(
        'id-ID',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }
    )
}

onMounted(async () => {
    try {

        loading.value = true

        const response =
            await dashboardService.getUserDashboard()

        const data = response.data.data

        user.value = data.user

        popularIssues.value =
            data.popularIssues || []

        recentActivity.value =
            data.recentActivity || []

    } catch (error) {
        console.log(error)
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <div class="dashboard-page">

        <!-- HEADER -->
        <div class="dashboard-header">

            <div class="user-info">

                <div class="user-avatar">
                    <i class="fa-regular fa-user"></i>
                </div>

                <div>

                    <h2>
                        Welcome,
                        {{ user.name || 'Employee' }}
                    </h2>

                    <p>
                        ID:
                        {{ user.employeeId || '-' }}
                    </p>

                </div>

            </div>

            <button
                class="logout-button"
                @click="showLogoutModal = true"
            >
                <i class="fa-solid fa-right-from-bracket"></i>

                Logout
            </button>

        </div>

        <!-- SEARCH -->
        <div class="search-wrapper">

            <i class="fa-solid fa-magnifying-glass"></i>

            <input
                type="text"
                placeholder="Search your problem..."
            />

        </div>

        <!-- QUICK ACTION -->
        <section class="dashboard-section">

            <h3 class="section-title">
                Quick Actions
            </h3>

            <div class="quick-grid">

                <div @click="goToChat">

                    <QuickActionCard
                        title="Start Chat"
                        subtitle="Talk to AI Assistant"
                        icon="fa-regular fa-comment"
                    />
                </div>

                <QuickActionCard
                    title="View FAQ"
                    subtitle="Browse knowledge base"
                    icon="fa-solid fa-book-open"
                />

                <QuickActionCard
                    title="Report Issue"
                    subtitle="Submit a ticket"
                    icon="fa-solid fa-circle-exclamation"
                />

            </div>

        </section>

        <!-- POPULAR ISSUES -->
        <section class="dashboard-section">

            <h3 class="section-title">
                Popular Issues
            </h3>

            <div class="issue-list">

                <PopularIssueCard
                    v-for="issue in popularIssues"
                    :key="issue.id"
                    :title="issue.name"
                    :subtitle="
                        issue.description ||
                        'No description'
                    "
                    :total="issue.count"
                    icon="fa-solid fa-print"
                />

            </div>

        </section>

        <!-- RECENT ACTIVITY -->
        <section class="dashboard-section">

            <h3 class="section-title">
                Recent Activity
            </h3>

            <div class="activity-list">

                <RecentActivityCard
                    v-for="activity in recentActivity"
                    :key="activity.id"
                    :title="
                        activity.title ||
                        'Untitled Session'
                    "
                    :time="
                        formatDate(activity.updatedAt)
                    "
                    :status="activity.status"
                />

                <!-- EMPTY STATE -->
                <div
                    v-if="
                        !loading &&
                        recentActivity.length === 0
                    "
                    class="empty-state"
                >
                    No recent activity
                </div>

            </div>

        </section>

    </div>
    <!-- LOGOUT MODAL -->
<div
    v-if="showLogoutModal"
    class="modal-overlay"
>
    <div class="logout-modal">

        <div class="modal-icon">
            <i class="fa-solid fa-right-from-bracket"></i>
        </div>

        <h3>Logout Confirmation</h3>

        <p>
            Are you sure you want to logout?
        </p>

        <div class="modal-actions">

            <button
                class="cancel-button"
                @click="showLogoutModal = false"
            >
                Cancel
            </button>

            <button
                class="confirm-button"
                @click="logout"
            >
                Logout
            </button>

        </div>

    </div>
</div>
</template>