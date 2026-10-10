Rails.application.routes.draw do
  root "application#index"

  devise_for :users,
             skip: %i[sessions registrations passwords]

  devise_scope :user do
    post "login", to: "api/v1/sessions#create"
    delete "logout", to: "api/v1/sessions#destroy"
    get "current_user", to: "api/v1/current_user#show"
    patch "current_user", to: "api/v1/current_user#update"
  end

  namespace :api do
    namespace :v1 do
      devise_scope :user do
        post "login", to: "sessions#create", as: :login
        post "logout", to: "sessions#destroy", as: :logout
        delete "logout", to: "sessions#destroy", as: nil
      end
      get "current_user", to: "current_user#show"
      patch "current_user", to: "current_user#update"
      get "me", to: "current_user#show"
      resources :users, only: %i[index show create update destroy]
      resources :departments, only: %i[index show]
      resources :roles, only: :index
      resources :salaries, only: %i[index show create update]
      resources :payslips, only: %i[index show]
      resources :users, only: [] do
        resources :salary_revisions, only: %i[index create]
      end
    end
  end

  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.

  # Defines the root path route ("/")
  # root "posts#index"
end
